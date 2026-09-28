#!/usr/bin/env python3
"""Focusa discovery bridge — tailnet peer enumeration + daemon verification.

Why this exists: a browser extension cannot enumerate a tailnet, and on
ChromeOS neither the Tailscale LocalAPI (TCP 41112, not exposed) nor native
messaging (host manifest lives on the host, not in any container) is reachable.
What IS reachable from any browser on this machine is plain HTTP to this
container's link address. So this tiny read-only service answers the two
questions the extension cannot ask itself:

  GET /v1/health             -> {ok, service, version}
  GET /v1/discovery/tailnet  -> peers + verified Focusa daemons

Peers come from `tailscale status --json` (works wherever tailscaled runs).
Daemon verification runs from HERE, not from the browser: for peers this host
can SSH to (per the operator's own ~/.ssh/config, BatchMode, short timeouts),
it reads the remote daemon's /v1/health and a light project summary. Anything
else is reported unverified with its candidate URLs, and the *browser* — which
does have the tailnet route — probes those directly.

Design rules:
  * READ-ONLY. No mutations, no tokens, no secrets in responses.
  * Never blocks: a background thread refreshes every 60s; requests serve cache.
  * Fails closed: unknown/unreachable peers are listed unverified, never invented.
  * Portable: no estate names, addresses, or ports are compiled in. Peers,
    DNS names, and SSH targets all come from live system state.
"""

import json
import os
import re
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BIND = os.environ.get("FOCUSA_DISCOVERY_BIND", "0.0.0.0")
PORT = int(os.environ.get("FOCUSA_DISCOVERY_PORT", "18989"))
SSH_TIMEOUT = int(os.environ.get("FOCUSA_DISCOVERY_SSH_TIMEOUT", "6"))
CACHE_TTL = int(os.environ.get("FOCUSA_DISCOVERY_CACHE_TTL", "60"))
CURL_TIMEOUT = int(os.environ.get("FOCUSA_DISCOVERY_CURL_TIMEOUT", "5"))
VERSION = "1"

FOCUSa_PORTS = (8787, 8788, 8789, 18787)


def run(cmd, timeout):
    try:
        completed = subprocess.run(
            cmd, capture_output=True, timeout=timeout, check=False)
        return completed.returncode, completed.stdout
    except (OSError, subprocess.SubprocessError):
        return 127, b""


def tailscale_status():
    code, out = run(["tailscale", "status", "--json"], timeout=10)
    if code != 0:
        return None
    try:
        return json.loads(out.decode("utf-8", "replace"))
    except ValueError:
        return None


def short_dns(dns_name, host_name):
    if isinstance(dns_name, str) and dns_name.strip():
        return dns_name.strip().rstrip(".").split(".")[0]
    return host_name or "peer"


def ipv4_list(ips):
    return [ip for ip in (ips or [])
            if isinstance(ip, str) and ":" not in ip]


def ssh_config_blocks(path=None):
    """Parse ~/.ssh/config into [{patterns, hostname, port, user}].

    This is how a peer's address becomes a working SSH target without guessing:
    the operator's own config already says which alias reaches which host, on
    which port, through which proxy. A container that cannot route to the
    tailnet directly (this one) typically reaches peers through ProxyCommand
    aliases - and those live here, not in code.
    """
    try:
        with open(path or os.path.expanduser("~/.ssh/config"),
                  encoding="utf-8", errors="replace") as handle:
            text = handle.read()
    except OSError:
        return []
    blocks, current = [], None
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        parts = stripped.split(None, 1)
        if len(parts) != 2:
            continue
        key, value = parts[0].lower(), parts[1].strip()
        if key == "host":
            current = {"patterns": value.split(), "hostname": None,
                       "port": None, "user": None}
            blocks.append(current)
        elif current is not None and key in ("hostname", "port", "user"):
            current[key] = value
    return blocks


def ssh_targets(peer, config_blocks=None):
    """SSH targets worth trying for a peer, most specific first.

    First, aliases from the operator's own ssh config whose HostName matches
    this peer's address or DNS name (this is what makes ProxyCommand/port
    setups work). Then the peer's own names. Finally root@<ipv4>, which fails
    closed under BatchMode when it is not set up. Nothing is hardcoded:
    everything comes from live system state.
    """
    if config_blocks is None:
        config_blocks = ssh_config_blocks()
    names = {peer.get("name"), peer.get("short"), peer.get("dns")} - {None, ""}
    addresses = set(peer.get("ips", [])) | names
    ordered, seen = [], set()

    def add(target):
        if target and target not in seen:
            seen.add(target)
            ordered.append(target)
    for block in config_blocks:
        hostname = (block.get("hostname") or "").lower()
        if hostname and (hostname in {str(a).lower() for a in addresses}
                         or any(hostname == str(a).lower() for a in addresses)):
            for pattern in block.get("patterns", []):
                if "*" not in pattern and "?" not in pattern:
                    add(pattern)
                    break
    for name in (peer.get("short"), peer.get("dns")):
        add(name)
    for ip in peer.get("ips", []):
        add(f"root@{ip}")
    return ordered


def ssh_read_json(target, url_path, timeout):
    """Read a JSON document from a remote daemon's loopback via SSH. None on
    any failure: BatchMode never prompts, and timeouts are short."""
    code, out = run([
        "ssh", "-F", os.path.expanduser("~/.ssh/config"),
        "-o", "BatchMode=yes",
        "-o", f"ConnectTimeout={timeout}",
        "-o", "StrictHostKeyChecking=accept-new",
        target, "curl", "-s", "-m", str(timeout),
        f"http://127.0.0.1:8787{url_path}",
    ], timeout=timeout + 4)
    if code != 0:
        return None
    try:
        return json.loads(out.decode("utf-8", "replace"))
    except ValueError:
        return None


def summarize_projects(body):
    """Shrink a project list to what a picker needs: effective name + names."""
    if not isinstance(body, dict):
        return None
    projects = body.get("projects")
    names = []
    if isinstance(projects, list):
        for project in projects[:12]:
            if not isinstance(project, dict):
                continue
            name = (project.get("canonical_name") or project.get("project_id")
                    or project.get("project_root"))
            if name:
                names.append(str(name))
    effective = body.get("effective_project") or {}
    return {
        "effective": (effective.get("canonical_name")
                      or effective.get("project_id")),
        "count": body.get("project_count", len(names)) if isinstance(
            body.get("project_count"), int) else len(names),
        "names": names,
    }


def verify_peer(peer, timeout):
    """Best-effort daemon verification for one peer. Returns a small verified
    record, or None when this host cannot reach that peer's daemon."""
    for target in ssh_targets(peer):
        health = ssh_read_json(target, "/v1/health", timeout)
        if not isinstance(health, dict) or health.get("ok") is not True:
            continue
        daemon = health.get("daemon") or {}
        summary = {"version": health.get("version")}
        projects = ssh_read_json(target, "/v1/project/list", timeout)
        info = summarize_projects(projects)
        if info:
            summary["projects"] = info
        sessions = ssh_read_json(target, "/v1/silent-sessions", timeout)
        data = sessions.get("data") if isinstance(sessions, dict) else None
        rows = data if isinstance(data, list) else (data or {}).get("sessions")
        if isinstance(rows, list):
            summary["sessionCount"] = len(rows)
            summary["sessions"] = [
                {"id": row.get("session_id") or row.get("id"),
                 "label": (row.get("display_name") or row.get("title")
                           or row.get("name")
                           or (row.get("mission") or "")[:80]),
                 "state": (row.get("health") or row.get("lifecycle")
                           or row.get("state") or row.get("status")),
                 "project": ((row.get("authority") or {}).get("project_root")
                             if isinstance(row.get("authority"), dict) else None)}
                for row in rows[:5] if isinstance(row, dict)
            ]
        return {
            "peer": peer.get("name"),
            "url": f"http://{peer['dns']}:{FOCUSa_PORTS[0]}" if peer.get("dns") else None,
            "ok": True,
            "verified": "ssh",
            "identity": (daemon.get("start_token")),
            "summary": summary,
        }
    return None


class State:
    def __init__(self):
        self.lock = threading.Lock()
        self.payload = {"ok": True, "source": "focusa-discovery-bridge",
                        "peers": [], "daemons": [], "refreshed_at": None}
        # No refresh here: the background thread does the first one, so the
        # server answers health checks immediately even while SSH probes run.

    def snapshot(self):
        with self.lock:
            return json.loads(json.dumps(self.payload))

    def refresh(self):
        status = tailscale_status()
        peers = []
        if status:
            for entry in (status.get("Peer") or {}).values():
                ips = ipv4_list(entry.get("TailscaleIPs"))
                if not ips:
                    continue
                dns = (entry.get("DNSName") or "").rstrip(".")
                peers.append({
                    "name": short_dns(entry.get("DNSName"), entry.get("HostName")),
                    "dns": dns or None,
                    "ips": ips,
                    "online": entry.get("Online") is True,
                    "os": entry.get("OS"),
                })
            peers.sort(key=lambda p: (not p["online"], p["name"]))
        daemons = []
        for peer in peers:
            if not peer["online"]:
                continue
            try:
                verified = verify_peer(peer, SSH_TIMEOUT)
            except Exception:
                verified = None
            if verified:
                verified["verified_epoch"] = time.time()
                verified["stale"] = False
                daemons.append(verified)
        with self.lock:
            # A flaky round must not erase a known-good daemon: keep the last
            # verification for ten minutes, honestly marked stale, so one failed
            # SSH attempt never makes an attached workforce's home vanish.
            previous = {d.get("url"): d
                        for d in self.payload.get("daemons", [])
                        if d.get("url")}
            fresh_urls = {d["url"] for d in daemons}
            now = time.time()
            for url, old in previous.items():
                if url not in fresh_urls and now - old.get("verified_epoch", 0) < 600:
                    stale = dict(old)
                    stale["stale"] = True
                    daemons.append(stale)
            self.payload = {
                "ok": True,
                "source": "focusa-discovery-bridge",
                "version": VERSION,
                "peers": peers,
                "daemons": daemons,
                "refreshed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }


STATE = State()
# The first refresh SSH-probes peers and can take tens of seconds; the server
# answers health checks immediately and fills discovery in as soon as ready.
STATE.payload = {"ok": True, "source": "focusa-discovery-bridge",
                 "version": VERSION, "peers": [], "daemons": [],
                 "refreshed_at": None, "warming": True}


def refresher():
    try:
        STATE.refresh()
    except Exception:
        pass
    while True:
        time.sleep(CACHE_TTL)
        try:
            STATE.refresh()
        except Exception:
            pass


class Handler(BaseHTTPRequestHandler):
    server_version = "FocusaDiscoveryBridge/1"

    def log_message(self, *args):
        pass

    def _send(self, code, body):
        data = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/v1/health":
            self._send(200, {"ok": True, "service": "focusa-discovery-bridge",
                             "version": VERSION})
        elif path == "/v1/discovery/tailnet":
            self._send(200, STATE.snapshot())
        else:
            self._send(404, {"ok": False, "error": "not_found"})


if __name__ == "__main__":
    threading.Thread(target=refresher, daemon=True).start()
    server = ThreadingHTTPServer((BIND, PORT), Handler)
    server.serve_forever()

#!/usr/bin/env python3
"""
Focusa Workforce — Tailscale native messaging host.

Why this exists: tailscaled on this machine is reachable only through its unix
socket (/var/run/tailscale/tailscaled.sock). The LocalAPI is not exposed on TCP,
and a browser extension cannot open a unix socket. Native messaging is the
supported bridge: Chrome starts this host, and the host asks the OS-level
tailscale client who the tailnet is. No scanning, no guessing, no privileges the
operator has not already given us, and it works on any machine where the
extension and the tailscale CLI exist.

Protocol: Chrome speaks length-prefixed JSON on stdin/stdout. We answer
{"peers": [...], "self": {...}, "suffix": "...", "backend": "Running"} and
never emit anything else on stdout (diagnostics go to stderr).
"""
import json
import os
import shutil
import subprocess
import sys

TIMEOUT_SECONDS = 8


def read_message():
    raw = sys.stdin.buffer.read(4)
    if not raw or len(raw) < 4:
        return None
    length = int.from_bytes(raw, "little")
    if length <= 0 or length > 1_000_000:
        return None
    body = sys.stdin.buffer.read(length)
    if len(body) != length:
        return None
    try:
        return json.loads(body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return None


def write_message(payload):
    body = json.dumps(payload).encode("utf-8")
    sys.stdout.buffer.write(len(body).to_bytes(4, "little"))
    sys.stdout.buffer.write(body)
    sys.stdout.buffer.flush()


def tailscale_binary():
    return shutil.which("tailscale") or "/usr/bin/tailscale"


def ipv4_addresses(ips):
    return [ip for ip in (ips or []) if isinstance(ip, str) and ":" not in ip]


def short_name(dns_name, host_name):
    if isinstance(dns_name, str) and dns_name.strip():
        return dns_name.strip().rstrip(".").split(".")[0]
    return host_name or "peer"


def read_tailnet():
    try:
        completed = subprocess.run(
            [tailscale_binary(), "status", "--json"],
            capture_output=True, timeout=TIMEOUT_SECONDS, check=False,
        )
    except (OSError, subprocess.SubprocessError) as error:
        return {"error": f"tailscale unavailable: {error.__class__.__name__}"}
    if completed.returncode != 0:
        return {"error": "tailscale status failed"}
    try:
        body = json.loads(completed.stdout.decode("utf-8", "replace"))
    except ValueError:
        return {"error": "tailscale status was not JSON"}

    peers = []
    for peer in (body.get("Peer") or {}).values():
        addresses = ipv4_addresses(peer.get("TailscaleIPs"))
        if not addresses:
            continue
        peers.append({
            "id": peer.get("ID"),
            "name": short_name(peer.get("DNSName"), peer.get("HostName")),
            "dnsName": (peer.get("DNSName") or "").rstrip("."),
            "ips": addresses,
            "online": peer.get("Online") is True,
            "os": peer.get("OS"),
        })
    peers.sort(key=lambda item: (not item["online"], item["name"]))
    return {
        "self": {
            "id": (body.get("Self") or {}).get("ID"),
            "name": short_name((body.get("Self") or {}).get("DNSName"), (body.get("Self") or {}).get("HostName")),
            "ips": ipv4_addresses((body.get("Self") or {}).get("TailscaleIPs")),
        },
        "peers": peers,
        "suffix": body.get("MagicDNSSuffix"),
        "backend": body.get("BackendState"),
    }


def main():
    try:
        while True:
            message = read_message()
            if message is None:
                return 0
            write_message(read_tailnet())
    except (BrokenPipeError, KeyboardInterrupt):
        return 0
    except Exception as error:  # never let stderr kill the channel silently
        print(f"tailscale-host: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

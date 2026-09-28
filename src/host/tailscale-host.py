#!/usr/bin/env python3
"""
Focusa Workforce — local host program (native messaging).

A browser cannot open a unix socket or read this machine's interfaces, so the
extension asks a program that can. This one answers two questions, read-only:

  * who is on my tailnet  -> `tailscale status` (when the client is installed)
  * what addresses am I   -> this machine's own IPv4 addresses

Both are machine-specific by nature, which is exactly why they are read at
RUNTIME rather than compiled into the product: one build then works on any
computer. Nothing here is specific to any person, estate or network.

Protocol: Chrome speaks length-prefixed JSON on stdin/stdout. Diagnostics go to
stderr, never stdout.
"""
import json
import os
import re
import shutil
import socket
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


def local_ipv4_addresses():
    """This machine's own IPv4 addresses, however it is networked.

    Tried in order and merged: the OS interface list, then whatever the socket
    layer reports. A machine behind a Crostini bridge, a VPN or a container
    therefore reports those addresses without anyone hardcoding them.
    """
    found = set()
    for command in (["ip", "-4", "-o", "addr", "show"],
                     ["ifconfig", "-a"]):
        binary = shutil.which(command[0])
        if not binary:
            continue
        try:
            completed = subprocess.run([binary, *command[1:]], capture_output=True,
                                       timeout=4, check=False)
        except (OSError, subprocess.SubprocessError):
            continue
        text = completed.stdout.decode("utf-8", "replace")
        if command[0] == "ip":
            found.update(re.findall(r"inet (\d{1,3}(?:\.\d{1,3}){3})", text))
        else:
            found.update(re.findall(r"inet (?:addr:)?(\d{1,3}(?:\.\d{1,3}){3})", text))
        if found:
            break
    # A socket-based fallback for the address this machine answers on.
    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        probe.connect(("192.0.2.1", 9))          # TEST-NET-1: no packet is sent
        found.add(probe.getsockname()[0])
    except OSError:
        pass
    finally:
        probe.close()
    return sorted(ip for ip in found if not ip.startswith("127."))


def read_tailnet():
    result = {"localAddresses": local_ipv4_addresses(), "self": None, "peers": [],
              "suffix": None, "backend": None, "tailnet": False}
    try:
        completed = subprocess.run(
            [tailscale_binary(), "status", "--json"],
            capture_output=True, timeout=TIMEOUT_SECONDS, check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return result  # no tailscale here: still report this machine's addresses
    if completed.returncode != 0:
        return result
    try:
        body = json.loads(completed.stdout.decode("utf-8", "replace"))
    except ValueError:
        return result

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
    result.update({
        "tailnet": True,
        "self": {
            "id": (body.get("Self") or {}).get("ID"),
            "name": short_name((body.get("Self") or {}).get("DNSName"), (body.get("Self") or {}).get("HostName")),
            "ips": ipv4_addresses((body.get("Self") or {}).get("TailscaleIPs")),
        },
        "peers": peers,
        "suffix": body.get("MagicDNSSuffix"),
        "backend": body.get("BackendState"),
    })
    return result


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

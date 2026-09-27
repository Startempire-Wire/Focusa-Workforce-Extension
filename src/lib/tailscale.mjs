/**
 * Tailnet discovery via the Tailscale LocalAPI.
 *
 * A browser cannot enumerate a network, and a tailnet is deliberately opaque to
 * one. But the tailnet is not opaque to the *machine*: tailscaled publishes a
 * LocalAPI over loopback (documented by Tailscale, served by the same daemon
 * that holds the node key), and Chrome on this Chromebook runs on the same host
 * as tailscaled. So the extension can ask the tailnet itself who its peers are -
 * first-party, no scanning, no guessing.
 *
 *   GET http://127.0.0.1:41112/localapi/v0/status
 *
 * Only one extra origin is granted, and it is loopback on a single port. If the
 * LocalAPI is absent (older tailscaled, a different port, or a machine without
 * it) this returns null and discovery falls back to the host book - it never
 * invents peers.
 */

const LOCALAPI_CANDIDATES = Object.freeze([
  'http://127.0.0.1:41112/localapi/v0/status',
  'http://localhost:41112/localapi/v0/status',
]);

/** A peer worth probing: a machine that could be running a Focusa daemon. */
function peerCandidates(peer) {
  const ips = Array.isArray(peer?.TailscaleIPs) ? peer.TailscaleIPs : [];
  // IPv4 first: Focusa binds IPv4 loopback, and IPv6 tailnet addresses add noise.
  return ips.filter((ip) => typeof ip === 'string' && !ip.includes(':'));
}

function nameOf(peer) {
  const dns = String(peer?.DNSName ?? '').replace(/\.$/, '');
  const short = dns.split('.')[0];
  return short || peer?.HostName || null;
}

/**
 * Ask the local tailscaled who the tailnet is.
 *
 * @param {{fetchImpl?: function, timeoutMs?: number}} [options]
 * @returns {Promise<null | {self: object, peers: any[], suffix: string|null}>}
 *   null when the LocalAPI is not available here.
 */
export async function readTailscaleTopology({ fetchImpl = globalThis.fetch, timeoutMs = 2500 } = {}) {
  for (const url of LOCALAPI_CANDIDATES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        method: 'GET', cache: 'no-store', signal: controller.signal,
        headers: { accept: 'application/json' },
      });
      if (!response.ok) continue;
      const body = await response.json().catch(() => null);
      if (!body || typeof body !== 'object') continue;

      const self = {
        id: body?.Self?.ID ?? null,
        name: nameOf(body?.Self ?? {}) ?? body?.Self?.HostName ?? null,
        dnsName: String(body?.Self?.DNSName ?? '').replace(/\.$/, '') || null,
        ips: peerCandidates(body?.Self ?? {}),
        isSelf: true,
      };
      const peers = [];
      for (const peer of Object.values(body?.Peer ?? {})) {
        const ips = peerCandidates(peer);
        if (!ips.length) continue;
        peers.push({
          id: peer?.ID ?? null,
          name: nameOf(peer),
          dnsName: String(peer?.DNSName ?? '').replace(/\.$/, '') || null,
          ips,
          online: peer?.Online === true,
          os: peer?.OS ?? null,
          isSelf: false,
        });
      }
      // Online peers first, then by name: the machines most likely to be running
      // a daemon are the ones a person is sitting at.
      peers.sort((a, b) => (Number(b.online) - Number(a.online)) || String(a.name).localeCompare(String(b.name)));
      return { self, peers, suffix: body?.MagicDNSSuffix ?? null, backend: body?.BackendState ?? null };
    } catch { /* try the next LocalAPI address */ }
    finally { clearTimeout(timer); }
  }
  return null;
}

/**
 * Candidate origins for every peer that could be running Focusa, on the fixed
 * port set. Peers are probed, never swept: one host, four ports.
 *
 * @param {any} topology result of readTailscaleTopology
 * @param {{ports?: readonly number[]}} [options]
 */
export function tailnetCandidates(topology, { ports = [8787, 8788, 8789, 18787] } = {}) {
  if (!topology?.peers?.length) return [];
  const out = [];
  for (const peer of topology.peers) {
    // This machine's own tailnet address is already covered by the device
    // candidates; probing it twice would list the same daemon twice.
    if (peer.isSelf) continue;
    for (const ip of peer.ips) {
      for (const port of ports) {
        out.push(Object.freeze({
          origin: `http://${ip}:${port}`,
          host: ip,
          peer: peer.name,
          dnsName: peer.dnsName,
          online: peer.online,
          os: peer.os,
        }));
      }
    }
  }
  return Object.freeze(out);
}

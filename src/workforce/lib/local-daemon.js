/**
 * Local-daemon reachability (browser context).
 *
 * A Chrome extension runs in the *browser's* loopback namespace, not the
 * container's. On this ChromeOS/Crostini host the Focusa daemon (loopback-bound
 * at 127.0.0.1:8787 in penguin) is bridged by focusa-bridge.service to the
 * crosvm veth IP 100.115.92.26, so the browser must target THAT address.
 * On a normal desktop (extension and daemon sharing loopback) 127.0.0.1 wins.
 * Workforce tries the candidates in this order and keeps the first that answers.
 */

/** Local daemon base URLs, probed in order. crosvm veth first (this platform). */
export const LOCAL_DAEMON_CANDIDATES = Object.freeze([
  'http://100.115.92.26:8787',
  'http://127.0.0.1:8787',
  'http://localhost:8787',
]);

export function localDaemonCandidates() {
  return LOCAL_DAEMON_CANDIDATES;
}
/**
 * The connection contract, shared by every surface.
 *
 * Operator direction 2026-09-27: connect/disconnect must update in real time
 * and it must be obvious which state you are in, on the Start Page, the Side
 * Panel, the Full Workforce page and the Wall alike. Those surfaces are written
 * in different stacks (Svelte and plain modules), so the *language* of the
 * connection lives here and both sides render it the same way.
 *
 * Status is deliberately one of four, and never inferred from "am I showing
 * data":
 *
 *   connecting    a click is in flight
 *   connected     attached, and answering
 *   unreachable   attached, but it stopped answering (last known state retained)
 *   disconnected  nothing attached
 */

export const CONNECTION_STATUS = Object.freeze({
  connecting: 'connecting',
  connected: 'connected',
  unreachable: 'unreachable',
  connectedLost: 'unreachable',
  disconnected: 'disconnected',
});

/** @returns {{status: string, baseUrl: string|null, label: string|null, since: string|null, lastSeenAt: string|null, note: string|null}} */
export function initialConnection() {
  return { status: 'disconnected', baseUrl: null, label: null, since: null, lastSeenAt: null, note: null };
}

const COPY = Object.freeze({
  connecting: { label: 'Connecting', tone: 'pending', detail: 'Opening a connection…' },
  connected: { label: 'Connected', tone: 'live', detail: 'attached and answering' },
  unreachable: { label: 'Not answering', tone: 'lost', detail: 'attached, but the daemon stopped answering' },
  disconnected: { label: 'Disconnected', tone: 'off', detail: 'nothing is attached' },
});

/** The one place a status becomes words. */
export function describeConnection(connection) {
  const status = connection?.status && COPY[connection.status] ? connection.status : 'disconnected';
  const copy = COPY[status];
  const where = connection?.baseUrl ? ` · ${connection.baseUrl}` : '';
  return {
    status,
    tone: copy.tone,
    label: copy.label,
    detail: connection?.note || copy.detail,
    headline: `${copy.label}${where}`,
  };
}

/** A heartbeat beat updates the record the same way on every surface. */
export function applyBeat(connection, beat) {
  return beat?.ok
    ? { ...connection, status: 'connected', lastSeenAt: beat.at, note: null }
    : { ...connection, status: 'unreachable', note: 'The daemon stopped answering' };
}

/** True when the surface should be showing owner data rather than a prompt. */
export function isAttached(connection) {
  return connection?.status === 'connected' || connection?.status === 'unreachable';
}

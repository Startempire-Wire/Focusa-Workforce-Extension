import { validateConnectionRecord, validateLocalEnvironment } from './contracts.mjs';

const STORAGE_KEY = 'focusa.workforce.connections.v1';
const LOCAL_KEY = 'focusa.workforce.local_environments.v1';
function localArea(chromeApi) {
  if (!chromeApi?.storage?.local) throw new Error('chrome.storage.local is unavailable');
  return chromeApi.storage.local;
}

export async function listConnections(chromeApi = globalThis.chrome) {
  const result = await localArea(chromeApi).get(STORAGE_KEY);
  const raw = result?.[STORAGE_KEY] ?? [];
  if (!Array.isArray(raw)) throw new Error('stored connection collection is invalid');
  return raw.map(validateConnectionRecord);
}

export async function saveConnection(record, chromeApi = globalThis.chrome) {
  const valid = validateConnectionRecord(record);
  const current = await listConnections(chromeApi);
  const next = current.filter((item) => item.connection_id !== valid.connection_id);
  next.push(valid);
  next.sort((a, b) => a.connection_id.localeCompare(b.connection_id));
  await localArea(chromeApi).set({ [STORAGE_KEY]: next });
  const committed = (await listConnections(chromeApi)).find((item) => item.connection_id === valid.connection_id);
  if (!committed || committed.token !== valid.token) throw new Error('connection storage commit could not be verified');
  return committed;
}

export async function forgetConnection(connectionId, chromeApi = globalThis.chrome) {
  const current = await listConnections(chromeApi);
  const next = current.filter((item) => item.connection_id !== connectionId);
  await localArea(chromeApi).set({ [STORAGE_KEY]: next });
  return current.length !== next.length;
}

/**
 * Local (loopback) environments — the device itself is the authenticated
 * principal, so these carry no device token.
 *
 * @param {any} chromeApi
 * @returns {Promise<ReturnType<typeof validateLocalEnvironment>[]>}
 */
export async function listLocalEnvironments(chromeApi = globalThis.chrome) {
  const result = await localArea(chromeApi).get(LOCAL_KEY);
  const raw = result?.[LOCAL_KEY] ?? [];
  if (!Array.isArray(raw)) throw new Error('stored local environment collection is invalid');
  return raw.map(validateLocalEnvironment);
}

export async function saveLocalEnvironment(record, chromeApi = globalThis.chrome) {
  const valid = validateLocalEnvironment(record);
  const current = await listLocalEnvironments(chromeApi);
  const next = current.filter((item) => item.environment_id !== valid.environment_id);
  next.push(valid);
  next.sort((a, b) => a.environment_id.localeCompare(b.environment_id));
  await localArea(chromeApi).set({ [LOCAL_KEY]: next });
  return valid;
}

export async function forgetLocalEnvironment(environmentId, chromeApi = globalThis.chrome) {
  const current = await listLocalEnvironments(chromeApi);
  const next = current.filter((item) => item.environment_id !== environmentId);
  await localArea(chromeApi).set({ [LOCAL_KEY]: next });
  return current.length !== next.length;
}

export const connectionStorageKey = STORAGE_KEY;
export const localEnvironmentStorageKey = LOCAL_KEY;

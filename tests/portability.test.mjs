import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'src');

// This product ships to anyone. Nothing about one person, one estate, one
// machine or one network may be compiled into it - a previous version seeded the
// host book with one estate's node names and granted its tailnet IPs statically,
// which made the build work on exactly one computer.
const FORBIDDEN = [
  { pattern: /\b100\.(?!64\.\d|127\.)/, why: 'a hardcoded non-loopback 100.x address' },
  { pattern: /\b10\.\d+\.\d+\.\d+\b/, why: 'a hardcoded RFC1918 address' },
  { pattern: /\b192\.168\.\d+\.\d+\b/, why: 'a hardcoded LAN address' },
  { pattern: /\b(ovh|kh|macbook-pro|galaxy-s10e)\b/i, why: "one estate's machine names" },
  { pattern: /tail9229d6/i, why: "one tailnet's MagicDNS suffix" },
];

async function files(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await files(full));
    else if (/\.(mjs|js|json|html|css|py)$/.test(entry.name)) out.push(full);
  }
  return out;
}

test('no machine-specific address, host or network is compiled into the product', async () => {
  const problems = [];
  for (const file of await files(src)) {
    const text = await readFile(file, 'utf8');
    const relative = file.slice(src.length + 1);
    for (const { pattern, why } of FORBIDDEN) {
      // Prose in a comment may name the problem; code and configuration may not.
      const codeLike = text
        .split('\n')
        .filter((line) => !/^\s*(\*|\/\/|#)/.test(line) && !/tailnet\b/i.test(line))
        .join('\n');
      const match = codeLike.match(pattern);
      if (match) problems.push(`${relative}: ${why} (${match[0].trim()})`);
    }
  }
  assert.deepEqual(problems, [], 'the build must be machine-independent');
});

test('the host book ships empty', async () => {
  const { ESTATE_DEFAULTS } = await import('../src/lib/host-book.mjs');
  assert.deepEqual(ESTATE_DEFAULTS, [], 'no estate may be seeded');
});

test('the manifest grants only loopback and the local host program', async () => {
  const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
  assert.deepEqual([...manifest.host_permissions].sort(), [
    'http://127.0.0.1/*',
    'http://127.0.0.1:41112/*',
    'http://localhost/*',
  ]);
});

test('this machine\'s own addresses are read at runtime, not compiled', async () => {
  const host = await readFile(resolve(src, 'host', 'tailscale-host.py'), 'utf8');
  assert.match(host, /local_ipv4_addresses/, 'the host reports the machine\'s own addresses');
  const discovery = await readFile(resolve(src, 'lib', 'discovery.mjs'), 'utf8');
  assert.match(discovery, /localAddresses/, 'discovery consumes what the machine reported');
  assert.doesNotMatch(discovery, /100\.115\.92\.26/, 'and names no address of its own');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  pageContextFromCapture,
  createIncomingWorkDraft,
  createEvidenceCandidate,
  promptBodyFor,
  summarizeSelection,
} from '../src/lib/page-context.mjs';

test('summarizeSelection collapses whitespace and bounds length', () => {
  assert.equal(summarizeSelection('  a   b\t\nc  '), 'a b c');
  assert.equal(summarizeSelection('x'.repeat(600)).length, 501); // 500 + ellipsis
  assert.ok(summarizeSelection('x'.repeat(600)).endsWith('…'));
  assert.equal(summarizeSelection(42), '');
});

test('pageContextFromCapture builds a local-only http(s) capture envelope', () => {
  const capture = pageContextFromCapture({ url: 'https://example.com/a', title: '  Example  ', selectedText: 'pick me', capturedAt: '2026-09-27T00:00:00Z' });
  assert.equal(capture.schema, 'focusa.workforce.page_capture.v1');
  assert.equal(capture.url, 'https://example.com/a');
  assert.equal(capture.title, 'Example');
  assert.equal(capture.selection, 'pick me');
  assert.equal(capture.local, true); // honesty marker: never a daemon item
  assert.equal(capture.provisionedBy, 'extension:context-menu');
  assert.throws(() => pageContextFromCapture({ url: '' }), /URL/);
  assert.throws(() => pageContextFromCapture({ url: 'ftp://example.com' }), /http/);
  assert.throws(() => pageContextFromCapture({ url: 'not a url' }), /parseable/);
  assert.equal(pageContextFromCapture({ url: 'https://example.com' }).title, 'Untitled page');
});

test('createIncomingWorkDraft prefills a Direction instruction from the page', () => {
  const capture = pageContextFromCapture({ url: 'https://example.com/doc', title: 'Spec 17', selectedText: 'one two' });
  const draft = createIncomingWorkDraft(capture);
  assert.equal(draft.schema, 'focusa.workforce.incoming_work_draft.v1');
  assert.equal(draft.title, 'Spec 17');
  assert.equal(draft.source, 'https://example.com/doc');
  assert.ok(draft.instruction.includes('Page: Spec 17'));
  assert.ok(draft.instruction.includes('Selection:'));
  assert.ok(draft.instruction.includes('one two'));
  assert.equal(draft.local, true);
});

test('createEvidenceCandidate stages a browser-capture candidate', () => {
  const capture = pageContextFromCapture({ url: 'https://example.com', title: 'T', selectedText: 'proof' });
  const candidate = createEvidenceCandidate(capture);
  assert.equal(candidate.schema, 'focusa.workforce.evidence_candidate.v1');
  assert.equal(candidate.kind, 'browser_capture');
  assert.equal(candidate.note, 'proof');
  assert.equal(candidate.source, 'https://example.com');
  assert.equal(candidate.local, true);
});

test('promptBodyFor emits the daemon request schema (message + steer)', () => {
  const capture = pageContextFromCapture({ url: 'https://example.com', title: 'T', selectedText: 's' });
  const body = promptBodyFor(createIncomingWorkDraft(capture));
  assert.equal(body.streaming_behavior, 'steer');
  assert.ok(body.message.length > 1);
  assert.throws(() => promptBodyFor({}), /message/);
});
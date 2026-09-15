import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const script=fs.readFileSync(path.join(root,'scripts','wfx-deploy'),'utf8');

test('wfx resolves its real script path before deriving repo root',()=>{
  assert.match(script,/SCRIPT_PATH="\$\(readlink -f "\$\{BASH_SOURCE\[0\]\}"\)"/);
  assert.match(script,/REPO_ROOT="\$\(cd "\$\(dirname "\$SCRIPT_PATH"\)\/\.\." && pwd\)"/);
});

test('local deploy helper is defined once',()=>{
  assert.equal((script.match(/\ndeploy_local_browser\(\) \{/g)||[]).length,1);
});

test('GitHub push and Veragensia live promotion remain separate operations',()=>{
  assert.match(script,/gh\)/);
  assert.match(script,/git push origin/);
  assert.match(script,/veragensia\)/);
  assert.match(script,/uiai-lab-push --public-work/);
  assert.match(script,/git reset -q --hard origin\/main/);
  assert.match(script,/HEAD .* != local HEAD/);
});

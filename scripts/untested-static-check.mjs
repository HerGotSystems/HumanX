import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { UNTESTED_TESTING } from '../src/untested.js';

let passed=0;const test=(name,fn)=>{try{fn();passed++;console.log(`PASS ${name}`)}catch(e){console.error(`FAIL ${name}: ${e.message}`);process.exitCode=1}};
const schema=await readFile(new URL('../migrations/0010_untested_schema.sql',import.meta.url),'utf8');
const triggers=await readFile(new URL('../migrations/0011_untested_triggers.sql',import.meta.url),'utf8');
const entry=await readFile(new URL('../src/worker-entry.js',import.meta.url),'utf8');
const ui=await readFile(new URL('../public/apps/untested/index.html',import.meta.url),'utf8');

for(const table of ['untested_instrument_versions','untested_instrument_copy','untested_confidence_definitions','untested_scenario_definitions','untested_variant_definitions','untested_choice_definitions','untested_sessions','untested_responses']) test(`schema contains ${table}`,()=>assert.ok(schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`)));
test('responses use composite session/version FK',()=>assert.ok(schema.includes('FOREIGN KEY (session_id, instrument_version)')));
test('responses use composite choice/version/scenario/variant FK',()=>assert.ok(schema.includes('FOREIGN KEY (instrument_version, choice_id, scenario_id, variant)')));
for(const name of ['copy','conf','scenario','variant','choice']){
  test(`${name} insert freeze trigger`,()=>assert.ok(triggers.includes(`untested_${name}_no_insert_sealed`)));
  test(`${name} update freeze trigger`,()=>assert.ok(triggers.includes(`untested_${name}_no_update_sealed`)));
  test(`${name} delete freeze trigger`,()=>assert.ok(triggers.includes(`untested_${name}_no_delete_sealed`)));
  test(`${name} revision insert trigger`,()=>assert.ok(triggers.includes(`untested_${name}_revision_insert`)));
  test(`${name} revision update trigger`,()=>assert.ok(triggers.includes(`untested_${name}_revision_update`)));
  test(`${name} revision delete trigger`,()=>assert.ok(triggers.includes(`untested_${name}_revision_delete`)));
}
test('session trigger requires sealed hash',()=>assert.ok(triggers.includes('sealed_at IS NOT NULL')&&triggers.includes('content_hash IS NOT NULL')));
test('entry delegates non-UNTESTED traffic',()=>assert.ok(entry.includes('return humanxWorker.fetch(request, env, ctx)')));
test('UI states limitation',()=>assert.ok(ui.includes('This does not test what you would actually do')));
test('UI has no consistency score',()=>assert.ok(ui.includes('There is no consistency score')));

const bundle=UNTESTED_TESTING.authoredBundle();
UNTESTED_TESTING.validateBundle(bundle);
const first=await UNTESTED_TESTING.sha256(bundle);
const second=await UNTESTED_TESTING.sha256(JSON.parse(JSON.stringify(bundle)));
test('canonical SHA-256 fixture is deterministic',()=>assert.equal(first,second));
test('canonical SHA-256 is 64 hex characters',()=>assert.match(first,/^[a-f0-9]{64}$/));

console.log(`\n${passed} passed, ${process.exitCode?1:0} failed`);

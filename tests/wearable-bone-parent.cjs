const fs = require('fs'), path = require('path'), vm = require('vm');
const assert = require('assert'), Module = require('module');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const files = ['SaveGuard Animation Guard.dsa', 'SaveGuard Selective.dsa', 'SaveGuard Wearable Plan.dsa', 'SaveGuard Selected Context.dsa'];
const source = file => read('support/manager/' + file);
const results = [];
function test(name, fn) {
  try { fn(); results.push({name, passed: true}); }
  catch (error) { results.push({name, passed: false, error: error.stack}); }
}
function fixture() {
  const assets = {
    '/rig.dsf': {node_library: [
      {id: 'Figure', type: 'figure', name: 'Genesis8Female'},
      {id: 'Forearm', type: 'bone', name: 'rForearm', parent: '#Figure'},
      {id: 'Hand', type: 'bone', name: 'rHand', parent: '#Forearm'}
    ]},
    '/prop.dsf': {
      node_library: [{id: 'Prop', type: 'node', name: 'Prop'}],
      geometry_library: [{id: 'Geometry', vertices: {count: 1, values: [[0, 0, 0]]}}]
    }
  };
  const doc = {scene: {nodes: [
    {id: 'owner', name: 'Genesis8Female', url: '/rig.dsf#Figure', preview: {type: 'figure'}},
    {id: 'arm', url: '/rig.dsf#Forearm', parent: '#owner', preview: {type: 'bone'}},
    {id: 'hand', url: '/rig.dsf#Hand', parent: '#arm', preview: {type: 'bone'}},
    {id: 'prop', url: '/prop.dsf#Prop', parent: '#hand', geometries: [{id: 'propGeo', url: '/prop.dsf#Geometry'}]}
  ]}};
  const state = {verified: 0, closed: 0, resolverClosed: 0, opened: 0};
  const provider = {verifySource() { state.verified++; return true; }, readRecords() { return {}; }, close() { state.closed++; }};
  const resolve = file => ({verified: true, document: assets[file]});
  const c = {
    App: {versionString: '6.25.2026.14722'},
    SaveGuardMotionActions: {actions: {}},
    SaveGuardMinimalNative: {eligible() { return false; }},
    SaveGuardNativeSource: {open() { state.opened++; return {select() { return {document: doc, provider, metrics: {}}; }, close: provider.close}; }}
  };
  for (const file of files) vm.runInNewContext(source(file), c, {filename: file});
  const request = {actionKey: 'loadWearable', rowType: 'unknown', tabKey: 'characters', versionId: 'v', inspectionToken: 'token', rowKey: 'row', sourceId: 'prop'};
  const shown = {rowKey: 'row', sourceId: 'prop', actionKeys: ['loadWearable'], hasOwnGeometry: true, parentLabel: 'Right Hand', ownershipRootId: 'owner'};
  const preview = {versionId: 'v', inspectionToken: 'token', provider, view: {tabs: {characters: [shown], objects: [shown]}, mapping: {rowByKey: {$row: {kind: 'node', savedId: 'prop'}}}}};
  const version = {scenePath: 'memory-only.duf', manifest: {source: 'memory-only.duf'}};
  const options = {characterNames: ['Genesis8Female'], createResolver() { return {resolveAssetDocument: resolve, close() { state.resolverClosed++; }}; }};
  return {c, doc, assets, state, request, shown, preview, version, options, resolve,
    verify() { return c.SaveGuardWearablePlan.verifyBoneParent(doc, 'prop', c.SaveGuardSelective, {resolveAssetDocument: resolve}); },
    context() { return c.SaveGuardSelectedContext.create(preview, version, request, options); }
  };
}
if (process.argv.includes('--expect-missing')) {
  const f = fixture();
  assert.strictEqual(typeof f.c.SaveGuardWearablePlan.verifyBoneParent, 'undefined');
  assert.throws(() => f.context(), /verifyBoneParent.*not a function/);
  console.log('Reproduced: unknown bone-parent prop fails in Selected Context because verifyBoneParent is not exported.');
  process.exit(0);
}
function reject(name, change, pattern) {
  test(name, () => { const f = fixture(); change(f); assert.throws(() => f.verify(), pattern); });
}
function frozen(value) { if (value && typeof value === 'object') { Object.keys(value).forEach(k => frozen(value[k])); Object.freeze(value); } return value; }
test('exports callable verifier and accepts fully verified bone-parent prop without changing source', () => {
  const f = fixture(), before = JSON.stringify([f.doc, f.assets]);
  frozen(f.doc); frozen(f.assets);
  assert.strictEqual(typeof f.c.SaveGuardWearablePlan.verifyBoneParent, 'function');
  assert.strictEqual(f.verify(), true);
  assert.strictEqual(JSON.stringify([f.doc, f.assets]), before);
});
test('unknown prop prepares in actual Selected Context without native DAZ calls', () => {
  const f = fixture(), lease = f.context();
  assert.strictEqual(lease.context.planningDocument, f.doc);
  assert.strictEqual(lease.context.catalog.rows.find(r => r.id === 'prop').type, 'unknown');
  assert.strictEqual(lease.context.view.tabs.characters[0].actionKeys[0], 'loadWearable');
  assert.strictEqual(lease.verify(), true);
  lease.close(); lease.close();
  assert.strictEqual(f.state.closed, 1); assert.strictEqual(f.state.resolverClosed, 1);
});
test('All Objects request takes the same verified prop path', () => {
  const f = fixture(); f.request.tabKey = 'objects'; const lease = f.context();
  assert.strictEqual(lease.context.view.tabs.objects[0].id, 'prop'); lease.close();
});
test('non-bone parent returns false and Selected Context still rejects it', () => {
  const f = fixture(); f.doc.scene.nodes[3].parent = '#owner';
  assert.strictEqual(f.verify(), false);
  assert.throws(() => f.context(), /Unsupported bone-parent prop/);
  assert.strictEqual(f.state.closed, 1); assert.strictEqual(f.state.resolverClosed, 1);
});
for (const [name, change] of [
  ['missing selected node', f => f.doc.scene.nodes.pop()],
  ['missing parent instance', f => f.doc.scene.nodes[3].parent = '#absent'],
  ['unparented prop', f => delete f.doc.scene.nodes[3].parent],
  ['Fit To binding', f => f.doc.scene.nodes[3].conform_target = '#owner'],
  ['parent-in-place binding', f => f.doc.scene.nodes[3].parent_in_place = '#hand']
]) test(name + ' is not accepted as bone-parent subtype', () => { const f = fixture(); change(f); assert.strictEqual(f.verify(), false); });
reject('duplicate instance identity remains rejected', f => f.doc.scene.nodes.push({...f.doc.scene.nodes[3]}), /Duplicate source node identity/);
reject('planner errors are not swallowed', f => f.c.SaveGuardSelective.plan = () => { throw Error('Must not plan'); }, /Must not plan/);
test('unverified resolver result cannot bypass ancestry validation', () => {
  const f = fixture(); assert.throws(() => f.c.SaveGuardWearablePlan.verifyBoneParent(f.doc, 'prop', f.c.SaveGuardSelective, {resolveAssetDocument: p => ({verified: false, document: f.assets[p]})}), /Unverified bone-parent asset/);
});
reject('missing external definition remains rejected', f => f.assets['/rig.dsf'].node_library.pop(), /Unsupported inherited bone-parent definition/);
reject('ambiguous external definition remains rejected', f => f.assets['/rig.dsf'].node_library.push({...f.assets['/rig.dsf'].node_library[2]}), /Ambiguous bone-parent definition/);
reject('inherited parent definition remains rejected', f => f.assets['/rig.dsf'].node_library[2].source = '/other.dsf#Hand', /Unsupported inherited bone-parent definition/);
reject('wrong parent ancestry remains rejected', f => f.assets['/rig.dsf'].node_library[2].parent = '#Figure', /ancestry differs/);
reject('cyclic instance ancestry remains rejected', f => f.doc.scene.nodes[1].parent = '#hand', /Cyclic source bone parent/);
reject('missing owner remains rejected', f => f.doc.scene.nodes[1].parent = '#absent', /Bone owner figure unavailable/);
reject('duplicate bone names remain rejected', f => f.assets['/rig.dsf'].node_library[1].name = 'rHand', /Ambiguous owner bone names/);
reject('non-geometry prop remains rejected', f => delete f.doc.scene.nodes[3].geometries, /single-geometry prop/);
reject('multiple geometry prop remains rejected', f => f.doc.scene.nodes[3].geometries.push({id: 'second', url: '/prop.dsf#Geometry'}), /single-geometry prop/);
reject('incomplete dependency closure remains rejected', f => f.c.SaveGuardSelective.plan = () => ({ready: false, errors: ['fixture missing dependency']}), /Incomplete bone-parent wearable closure/);
reject('dependency outside selected descendants remains rejected', f => f.c.SaveGuardSelective.plan = () => ({ready: true, nodeIds: ['prop', 'owner']}), /outside selected descendants/);
test('owner authorization remains checked after subtype verification', () => {
  const f = fixture(); f.shown.ownershipRootId = 'differentOwner';
  assert.throws(() => f.context(), /does not confirm.*ownership/);
  assert.strictEqual(f.state.closed, 1); assert.strictEqual(f.state.resolverClosed, 1);
});
test('cancellation from dependency resolver is not swallowed', () => {
  const f = fixture(), cancellation = Object.assign(Error('cancelled'), {code: 'CANCELLED'});
  assert.throws(() => f.c.SaveGuardWearablePlan.verifyBoneParent(f.doc, 'prop', f.c.SaveGuardSelective, {resolveAssetDocument() { throw cancellation; }}), error => error === cancellation);
});
test('prepare preserves detached payload and exact target bone contract', () => {
  const f = fixture(), prepared = f.c.SaveGuardWearablePlan.prepare(f.doc, 'prop', f.c.SaveGuardSelective, {resolveAssetDocument: f.resolve});
  assert.strictEqual(prepared.targetContract.boneParent, true);
  assert.strictEqual(prepared.targetContract.parentURI, 'name://@selection/rHand:');
  assert.deepEqual(Array.from(prepared.plan.nodeIds), ['prop']);
  assert.strictEqual(f.doc.scene.nodes[3].parent, '#hand');
  assert.strictEqual(prepared.document.scene.nodes[3].parent, undefined);
  assert.strictEqual(prepared.validateBuilt({document: {scene: {nodes: [{id: 'mapped-prop'}]}}, mapId: id => 'mapped-' + id}), true);
  assert.throws(() => prepared.validateBuilt({document: {scene: {nodes: [{id: 'mapped-owner'}]}}, mapId: id => 'mapped-' + id}), /contains owner/);
  assert.throws(() => prepared.validateBuilt({document: {scene: {nodes: [], animations: [{}]}}, mapId: id => id}), /Invalid native animation address/);
});
test('ES3/ES5 syntax and exact shipped module parity', () => {
  const ac = new Module('acorn');
  ac._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'], 'acorn');
  const bundle = read('Scene File Workbench.dsa').replace(/\r\n/g, '\n');
  for (const file of files) {
    const s = source(file).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    assert.strictEqual(bundle.split(s).length, 2, file + ' differs from shipped bundle');
    for (const ecmaVersion of [3, 5]) ac.exports.parse(s, {ecmaVersion, allowReserved: false});
  }
  for (const ecmaVersion of [3, 5]) ac.exports.parse(bundle, {ecmaVersion, allowReserved: false});
});
console.log(JSON.stringify({total: results.length, passed: results.filter(r => r.passed).length, nativeDAZExecuted: false, realScenesModified: false, results}, null, 2));
if (results.some(r => !r.passed)) process.exitCode = 1;

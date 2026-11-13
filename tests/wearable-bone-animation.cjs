const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert'), Module = require('module');
const root = path.resolve(__dirname, '..');
const files = ['SaveGuard Selective.dsa', 'SaveGuard Animation Guard.dsa', 'SaveGuard Minimal Timeline.dsa', 'SaveGuard Wearable Plan.dsa', 'SaveGuard Wearable Manager.dsa'];
const read = f => fs.readFileSync(path.join(root, 'support/manager', f), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const results = [];
function test(name, fn) { try { fn(); results.push({name, passed: true}); } catch (e) { results.push({name, passed: false, error: e.stack}); } }
function fixture() {
  const c = {}, assets = {
    '/rig.dsf': {node_library: [{id: 'Figure', type: 'figure', name: 'Figure'}, {id: 'Hip', type: 'bone', name: 'hip', parent: '#Figure'}, {id: 'Pelvis', type: 'bone', name: 'pelvis', parent: '#Hip'}]},
    '/prop.dsf': {node_library: [{id: 'Prop', type: 'node', name: 'Prop'}], geometry_library: [{id: 'Geo', vertices: {count: 1, values: [[0, 0, 0]]}}]}
  };
  const doc = {asset_info: {id: '/fixture.duf'}, modifier_library: [
    {id: 'Morph', parent: '/prop.dsf#Prop', channel: {id: 'value', type: 'float', value: 0}},
    {id: 'Push', parent: '/prop.dsf#Prop', extra: [{type: 'studio/modifier/push'}, {type: 'studio_modifier_channels', channels: [{channel: {id: 'Value', type: 'float', value: 0.1}}]}]}
  ], scene: {nodes: [
    {id: 'owner', url: '/rig.dsf#Figure', preview: {type: 'figure'}},
    {id: 'hip', url: '/rig.dsf#Hip', parent: '#owner', preview: {type: 'bone'}},
    {id: 'pelvis', url: '/rig.dsf#Pelvis', parent: '#hip', preview: {type: 'bone'}},
    {id: 'prop', url: '/prop.dsf#Prop', parent: '#pelvis', geometries: [{id: 'shape', url: '/prop.dsf#Geo'}]}
  ], modifiers: [{id: 'morphInstance', url: '#Morph', parent: '#prop'}, {id: 'pushInstance', url: '#Push', parent: '#prop'}], animations: [
    {url: 'prop:#Morph?value/value', keys: [[0, 0], [3, 0], [3.333333, 1]]},
    {url: 'prop:#Push?extra/studio_modifier_channels/channels/Value/value', keys: [[0, 0.1], [1.666667, 0.3], [3.333333, 0.1]]},
    {url: '#owner?translation/x/value', keys: [[0, 1], [3, 3]]}
  ], extra: [{type: 'studio_scene_settings', animation_settings: {current_frames_per_second: 30, current_time: 2, animation_range: [0, 10], play_range: [0, 10]}}]}};
  for (const file of files.slice(0, -1)) vm.runInNewContext(read(file), c, {filename: file});
  const resolve = f => ({verified: true, document: assets[f]});
  function prepare() { return c.SaveGuardWearablePlan.prepare(doc, 'prop', c.SaveGuardSelective, {resolveAssetDocument: resolve}); }
  function extract(p) { return c.SaveGuardSelective.extract(p.document, p.plan, {namespace: 'wearable_fixture', resolveAssetDocument: resolve, resolveExternal: file => ({exists: !!assets[file], uri: file})}); }
  return {c, doc, assets, resolve, prepare, extract, build() { const p = prepare(), b = extract(p); p.validateBuilt(b); return {p, b}; }};
}
function reject(name, change, pattern) { test(name, () => { const f = fixture(); change(f); assert.throws(() => f.build(), pattern); }); }
function rejectBuilt(name, change, pattern) { test(name, () => { const f = fixture(), p = f.prepare(), b = f.extract(p); change(b, f); assert.throws(() => p.validateBuilt(b), pattern); }); }

test('keeps actual-shaped morph and push animation tuples, maps owners, excludes destination animation', () => {
  const f = fixture(), before = JSON.stringify(f.doc), {p, b} = f.build();
  assert.deepStrictEqual(plain(p.plan.nodeIds), ['prop']);
  assert.strictEqual(b.document.scene.animations.length, 2);
  assert.deepStrictEqual(plain(b.document.scene.animations.map(a => a.keys)), f.doc.scene.animations.slice(0, 2).map(a => a.keys));
  for (const track of b.document.scene.animations) assert.ok(track.url.startsWith(b.mapId('prop') + ':#'));
  assert.strictEqual(b.document.scene.extra, undefined);
  assert.strictEqual(b.document.scene.nodes[0].parent, undefined);
  assert.strictEqual(p.targetContract.parentURI, 'name://@selection/pelvis:');
  assert.strictEqual(JSON.stringify(f.doc), before);
});
test('preserves authored interpolation tuples and custom track metadata unchanged', () => {
  const f = fixture(); f.doc.scene.animations[0].keys = [[-1, 0.2, 'linear'], [1, 0.8, 'TCB', 0.1, 0.2, 0.3]]; f.doc.scene.animations[0].vendor_metadata = {mode: 'keep'};
  const {b} = f.build(); assert.deepStrictEqual(plain(b.document.scene.animations[0].keys), f.doc.scene.animations[0].keys); assert.deepStrictEqual(plain(b.document.scene.animations[0].vendor_metadata), {mode: 'keep'});
});
test('root and child transform keys stay local to the retained descendants', () => {
  const f = fixture(); f.assets['/child.dsf'] = {node_library: [{id: 'Child', type: 'node'}]}; f.doc.scene.nodes.push({id: 'child', url: '/child.dsf#Child', parent: '#prop'});
  f.doc.scene.animations.push({url: '#prop?translation/x/value', keys: [[0, 1], [1, 2]]}, {url: '#child?rotation/z/value', keys: [[0, 4], [1, 8]]});
  const {b} = f.build(); assert.strictEqual(b.document.scene.nodes.length, 2); assert.strictEqual(b.document.scene.animations.length, 4);
});
test('constant keys are retained instead of being discarded as redundant', () => {
  const f = fixture(); f.doc.scene.animations[0].keys = [[0, 0.5], [1, 0.5]]; assert.deepStrictEqual(plain(f.build().b.document.scene.animations[0].keys), [[0, 0.5], [1, 0.5]]);
});
reject('duplicate target tracks reject', f => f.doc.scene.animations.push(plain(f.doc.scene.animations[0])), /Duplicate animation/);
reject('nonmonotonic times reject', f => f.doc.scene.animations[0].keys = [[1, 0], [0, 1]], /time order/);
reject('duplicate source times reject', f => f.doc.scene.animations[0].keys = [[0, 0], [0, 1]], /time order/);
reject('distinct source times collapsing onto one native tick reject', f => f.doc.scene.animations[0].keys = [[0, 0], [0.00001, 1]], /native tick precision/);
reject('unsafe native tick range rejects', f => f.doc.scene.animations[0].keys = [[Number.MAX_SAFE_INTEGER, 0]], /native tick precision/);
reject('empty keys reject', f => f.doc.scene.animations[0].keys = [], /no keys/);
for (const [name, value] of [['string', '0.1'], ['boolean', true], ['array', [0, 1]], ['null', null], ['NaN', NaN], ['Infinity', Infinity]]) reject(name + ' key values reject', f => f.doc.scene.animations[0].keys = [[0, value]], /finite numbers/);
reject('unsupported property selector rejects', f => f.doc.scene.animations[0].url = 'prop:#Morph?parent', /Unsupported bone-parent animated property/);
rejectBuilt('foreign qualified owner rejects after extraction', b => b.document.scene.animations[0].url = 'foreign:#' + b.mapId('Morph') + '?value/value', /Foreign.*owner/);
rejectBuilt('name-selection animation cannot modify the destination', b => b.document.scene.animations[0].url = 'name://@selection:?translation/x/value', /Invalid native animation address/);
rejectBuilt('missing definition rejects after extraction', b => b.document.modifier_library.shift(), /Missing native animation record/);
test('missing validator fails closed only for animated payloads', () => { const f = fixture(), p = f.prepare(), b = f.extract(p); f.c.SaveGuardAnimationGuard = undefined; assert.throws(() => p.validateBuilt(b), /validator unavailable/); delete b.document.scene.animations; assert.strictEqual(p.validateBuilt(b), true); });

function managerFixture(options = {}) {
  const f = fixture(), c = f.c;
  if (options.static) f.doc.scene.animations = [];
  const state = {time: 640, step: options.step || 200, animation: options.wide ? [-48000, 48000] : [0, 160], play: options.wide ? [-48000, 48000] : [0, 160], held: false, begin: 0, accepted: 0, loads: 0, rangeEdits: 0, selectionEdits: 0, staged: 0, removed: 0};
  const target = {assetSource: '/rig.dsf#Figure', inherits: t => t === 'DzFigure', select() { state.selectionEdits++; }}, bone = {inherits: t => t === 'DzBone', getSkeleton: () => target, select() { state.selectionEdits++; }};
  state.primary = options.bone ? bone : target; const originalSelection = state.primary;
  const scene = {getPrimarySelection: () => state.primary, getSelectedNodeList: () => [state.primary], getTime: () => state.time, setTime(t) { state.time = t; }, getTimeStep: () => state.step, getAnimRange: () => ({start: state.animation[0], end: state.animation[1]}), getPlayRange: () => ({start: state.play[0], end: state.play[1]}), isLoading: () => false,
    beginTimeEdit() { state.rangeEdits++; }, finishTimeEdit() { if (options.loseUndoOnTimeline) state.held = false; }, setAnimRange(r) { assert.ok(state.held); state.animation = [r.start, r.end]; }, setPlayRange(r) { assert.ok(state.held); state.play = [r.start, r.end]; },
    selectAllNodes() { state.selectionEdits++; }, setPrimarySelection(n) { state.selectionEdits++; state.primary = n; }};
  const io = {isReadingOrWriting: () => false, doLoad() { state.loads++; assert.ok(state.held); if (!options.static) assert.ok(state.animation[1] >= 16000); state.time = 0; if (options.loseUndoOnLoad) state.held = false; return options.loaderFailure ? 7 : 0; }};
  const env = {Scene: scene, App: {getAssetIOMgr: () => io}, DzAssetIOMgr: {MergeFile: 1}, DzTimeRange: function(a, b) { this.start = a; this.end = b; }, UndoStack: {canPushItems: () => state.held, isInUndoRedo: () => false}, pointersAreEqual: (a, b) => a === b,
    beginUndo() { state.begin++; state.held = true; }, acceptUndo() { assert.ok(state.held); state.accepted++; state.held = false; }};
  if (options.noTimelineAPIs) { delete env.DzTimeRange; delete scene.beginTimeEdit; delete scene.getTimeStep; delete scene.getAnimRange; delete scene.getPlayRange; }
  if (options.noRangeAPIs) { delete env.DzTimeRange; delete scene.beginTimeEdit; }
  const provider = {verifySource: () => true};
  const info = {context: {lowMemoryMode: false, planningDocument: f.doc, provider}, request: {sourceId: 'prop'}, resolver: {resolveAssetDocument: f.resolve, resolveExternal: () => true, visitFragments() {}, verifyAll: () => true}};
  c.SaveGuardNativeRuntime = {hostSupported: () => true}; c.SaveGuardFigureDependencies = {collect() {}};
  c.testStaging = {create(document) { state.staged++; state.payload = plain(document); return {path: 'memory-only.duf'}; }, verify: () => true, removeOwned() { state.removed++; return true; }};
  const source = read(files[files.length - 1]); assert.strictEqual(source.split('WearableSnapshotIO.create(env).staging()').length, 2);
  vm.runInNewContext(source.replace('WearableSnapshotIO.create(env).staging()', 'testStaging'), c);
  const api = c.SaveGuardWearableManager.create(env, info, {}), built = api.buildMerge(f.doc, 'prop', {namespace: 'manager_fixture', resolveExternal: file => ({exists: !!f.assets[file], uri: file})});
  const receipt = api.prepare({kind: 'merge', built: built.built, plan: built.plan, source: {verify: () => true}});
  return {...f, api, built, state, scene, env, receipt, originalSelection, apply(cancelled) { return api.apply(receipt, cancelled); }};
}
test('manager rebinds parent, preserves keys and widens ranges under Undo at 24fps', () => {
  const f = managerFixture({bone: true}); const r = f.apply(); assert.strictEqual(r.ok, true); assert.deepStrictEqual(f.state.animation, [0, 16000]); assert.deepStrictEqual(f.state.play, [0, 16000]); assert.strictEqual(f.state.step, 200); assert.strictEqual(f.state.time, 640); assert.strictEqual(f.state.primary, f.originalSelection); assert.strictEqual(f.state.loads, 1); assert.strictEqual(f.state.accepted, 1);
  assert.strictEqual(f.state.payload.scene.nodes[0].parent, 'name://@selection/pelvis:'); assert.strictEqual(f.state.payload.scene.nodes[0].conform_target, undefined); assert.strictEqual(f.state.payload.scene.animations.length, 2); assert.strictEqual(f.state.payload.scene.extra, undefined);
  assert.strictEqual(f.api.release(f.receipt), true); assert.strictEqual(f.state.removed, 1); f.api.close(); f.api.close();
});
test('wide destination ranges remain unchanged without range edit APIs', () => { const f = managerFixture({wide: true, noRangeAPIs: true}), r = f.apply(); assert.strictEqual(r.ok, true); assert.strictEqual(f.state.rangeEdits, 0); assert.deepStrictEqual(f.state.animation, [-48000, 48000]); });
test('static wearables have no new timeline API requirement', () => { const f = managerFixture({static: true, noTimelineAPIs: true}), r = f.apply(); assert.strictEqual(r.ok, true); assert.strictEqual(r.timeline, undefined); assert.strictEqual(f.state.rangeEdits, 0); });
test('unavailable widening APIs fail before Undo or native load', () => { const f = managerFixture({noRangeAPIs: true}), r = f.apply(); assert.strictEqual(r.ok, false); assert.match(r.error, /timeline APIs/); assert.strictEqual(f.state.begin, 0); assert.strictEqual(f.state.loads, 0); });
test('cancellation before mutation leaves timeline and selection untouched', () => { const f = managerFixture(), r = f.apply(() => true); assert.strictEqual(r.cancelled, true); assert.strictEqual(f.state.begin, 0); assert.strictEqual(f.state.loads, 0); assert.strictEqual(f.state.selectionEdits, 0); });
test('cancellation after widening but before native load restores ranges in owned Undo', () => { const f = managerFixture(), r = f.apply(() => f.state.rangeEdits > 0); assert.strictEqual(r.cancelled, true); assert.strictEqual(f.state.loads, 0); assert.deepStrictEqual(f.state.animation, [0, 160]); assert.deepStrictEqual(f.state.play, [0, 160]); assert.strictEqual(f.state.time, 640); assert.strictEqual(f.state.accepted, 1); });
test('failed loader returns failed-attempt Undo, preserving cursor and keys', () => { const f = managerFixture({loaderFailure: true}), r = f.apply(); assert.strictEqual(r.ok, false); assert.strictEqual(r.nativeExecuted, true); assert.strictEqual(f.state.time, 640); assert.strictEqual(f.state.accepted, 1); assert.deepStrictEqual(f.state.animation, [0, 16000]); });
test('lost Undo in timeline edit does not load or accept an unrelated hold', () => { const f = managerFixture({loseUndoOnTimeline: true}), r = f.apply(); assert.strictEqual(r.ok, false); assert.strictEqual(r.undoOwnershipLost, true); assert.strictEqual(r.undoStateUnknown, true); assert.strictEqual(r.mutationStarted, true); assert.strictEqual(f.state.loads, 0); assert.strictEqual(f.state.accepted, 0); });
test('lost Undo during native load does not restore context or accept foreign hold', () => { const f = managerFixture({loseUndoOnLoad: true}), r = f.apply(); assert.strictEqual(r.ok, false); assert.strictEqual(r.undoOwnershipLost, true); assert.strictEqual(f.state.accepted, 0); assert.strictEqual(f.state.selectionEdits, 0); });
test('restore failure still finalizes an intact failed-attempt Undo hold', () => { const f = managerFixture({loaderFailure: true}); f.scene.setTime = () => { throw Error('cursor restore failure'); }; const r = f.apply(); assert.strictEqual(r.ok, false); assert.match(r.contextRestoreError, /cursor restore failure/); assert.strictEqual(f.state.held, false); assert.strictEqual(f.state.accepted, 1); assert.strictEqual(r.undoStateUnknown, false); });
test('pre-load range rollback failure still finalizes an intact owned hold', () => { const f = managerFixture(); const set = f.scene.setAnimRange; f.scene.setAnimRange = range => { if (range.end === 160) throw Error('range rollback failure'); set(range); }; const r = f.apply(() => f.state.rangeEdits > 0); assert.strictEqual(r.cancelled, true); assert.strictEqual(f.state.loads, 0); assert.match(r.timelineRestoreError, /range rollback failure/); assert.strictEqual(f.state.held, false); assert.strictEqual(f.state.accepted, 1); });
test('receipt cannot execute twice', () => { const f = managerFixture(); assert.strictEqual(f.apply().ok, true); assert.strictEqual(f.apply().ok, false); assert.strictEqual(f.state.loads, 1); });
test('negative keys widen the lower range without changing fps or cursor', () => { const f = fixture(); const scene = {getTime: () => 640, getTimeStep: () => 200, getAnimRange: () => ({start: 0, end: 16000}), getPlayRange: () => ({start: 0, end: 16000})}; const p = f.c.SaveGuardMinimalTimeline.plan(scene, [{keys: [[-1, 0], [3, 1]]}]); assert.deepStrictEqual(plain(p.after), {time: 640, step: 200, animation: [-4800, 16000], play: [-4800, 16000]}); });
test('all touched modules and shipped bundle parse as ES3/ES5 and have exact module parity', () => {
  const ac = new Module('acorn'); ac._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'], 'acorn');
  const bundle = fs.readFileSync(path.join(root, 'Scene File Workbench.dsa'), 'utf8').replace(/\r\n/g, '\n');
  for (const file of files) { const s = read(file).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim(); assert.strictEqual(bundle.split(s).length, 2, file); for (const ecmaVersion of [3, 5]) ac.exports.parse(s, {ecmaVersion, allowReserved: false}); }
  for (const ecmaVersion of [3, 5]) ac.exports.parse(bundle, {ecmaVersion, allowReserved: false});
});
console.log(JSON.stringify({total: results.length, passed: results.filter(r => r.passed).length, nativeDAZExecuted: false, realScenesModified: false, results}, null, 2));
if (results.some(r => !r.passed)) process.exitCode = 1;

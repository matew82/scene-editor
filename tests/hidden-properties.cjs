// Hidden-property and tooltip regressions. All scenes/assets below are in-memory fixtures.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const native = require('./helpers/native-daz-files.cjs');
const root = path.resolve(__dirname, '..'), context = {};
for (const name of ['Gzip', 'Core', 'IO', 'Morphs', 'Objects', 'Controls', 'UI']) {
  vm.runInNewContext(fs.readFileSync(path.join(root, 'support', 'Scene Editor ' + name + '.dsa'), 'utf8'), context);
}
vm.runInNewContext(fs.readFileSync(path.join(root, 'support/manager/Scene Editor Key Editor.dsa'), 'utf8'), context);
const C = context.SceneEditorCore, U = context.SceneEditorUI;
const uiHarness = require('./helpers/property-ui.cjs')(context);
const results = [];
function test(name, body) {
  try { body(); results.push({name, passed:true}); }
  catch (error) { results.push({name, passed:false, error:error.stack}); }
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function fixture(source = 'DAZ', metadata = {}, group = '/Hidden/Correctives/Base') {
  const assetPath = '/data/V/Tank/Morphs/V/Base/pJCMAbdomen2Fwd_40.dsf';
  const asset = {asset_info:{id:assetPath,type:'modifier'}, modifier_library:[{
    id:'pJCMAbdomen2Fwd_40',name:'pJCMAbdomen2Fwd_40',parent:'/data/V/Tank/Tank.dsf#G',
    group,channel:{id:'value',type:'float',name:'Value',label:'pJCMAbdomen2Fwd_40',value:0,
      min:-1,max:1,display_as_percent:true,step_size:0.01,...metadata}
  }]};
  const doc = {scene:{nodes:[{id:'Tank',label:'Workout Tank',url:'/data/V/Tank/Tank.dsf#F',
    geometries:[{url:'/data/V/Tank/Tank.dsf#G'}],
    translation:[{id:'x',label:'Visible translation',type:'float',value:0}],
    rotation:[{id:'x',label:'Explicit hidden',type:'float',value:0,visible:false}]}],
    modifiers:[{id:'Corrective',url:assetPath+'#pJCMAbdomen2Fwd_40',parent:'#Tank',channel:{id:'value',current_value:0}}],
    extra:[{type:'studio_scene_settings',animation_settings:{current_time:0,current_frames_per_second:30,animation_range:[0,1]}}],
    animations:[{url:'#Corrective?value',keys:[[0,0],[1,0.5]]}]}};
  const files = {'/scene.duf':JSON.stringify(doc),
    '/data/V/Tank/Tank.dsf':JSON.stringify({node_library:[{id:'F',type:'figure'}]}),
    [assetPath]:JSON.stringify(asset),
    '/cache/data/V/Tank.cache.dsf':JSON.stringify({collection_info:{type:'cache',file_version:'0.6.0.0'},assets:[clone(asset)]})};
  const n = native(files);
  n.env.App.versionString = '4.24';
  n.env.App.getContentMgr = () => ({getNumContentDirectories(){return 1;},getContentDirectoryPath(){return '';},findFile(f){return f in files ? f : '';}});
  n.env.App.getAssetIOMgr = () => ({getDSONAssetCachePath(){return '/cache';}});
  const io = context.SceneEditorIO.create(n.env, () => {}, '/project/definition-index.json');
  return {source,n,files,doc,asset,assetPath,io,
    session(){return new context.SceneEditorObjects.Session('/scene.duf',io,()=>{},null);}};
}
function run(s, view, steps, options = {}) {
  const before = JSON.stringify(s.files);
  const out = uiHarness(s, steps, [1], true, {editorOptions:{
    path:'/scene.duf',objectId:'Tank',propertySource:s.source,propertyView:view,settingsManaged:true,...options
  }});
  assert.deepEqual(out.warn, []);
  assert.equal(s.files['/scene.duf'], JSON.parse(before)['/scene.duf'], 'No scene writes');
  assert.equal(s.files[s.assetPath], JSON.parse(before)[s.assetPath], 'No asset writes');
  assert.equal(s.files['/cache/data/V/Tank.cache.dsf'], JSON.parse(before)['/cache/data/V/Tank.cache.dsf'], 'No DAZ cache writes');
}
function row(h, view, label) {
  return view === 'TreeView' ? h.lists()[0].items.find(x => x.texts[0] === label) :
    h.controls.find(x => x.label === label && !x.destroyed);
}
for (const source of ['DAZ', 'Own']) for (const view of ['TreeView', 'Controls']) {
  test(source+' '+view+': Hidden Off filters authored Hidden group, counts it, repeated toggles preserve pending edits', () => {
    const s=fixture(source);
    run(s,view,h => {
      assert(row(h,view,'Visible translation'));
      assert(!row(h,view,'pJCMAbdomen2Fwd_40'),'Corrective must not be built when Hidden is Off');
      assert(!row(h,view,'Explicit hidden'));
      assert(!h.controls.some(x=>!x.destroyed && /<b><font[^>]*>Hidden<\/font>/.test(x.text||'')),'No empty Hidden group');
      if(view==='TreeView')assert(!h.lists()[0].items.some(x=>x.texts[0]==='Hidden'));
      assert(h.controls.some(x => typeof x.text==='string' && x.text.includes('3 properties (2 hidden)')));
      h.fire(h.button('Hidden Off'),'clicked()');
      let p=row(h,view,'pJCMAbdomen2Fwd_40'); assert(p);
      if (view==='Controls') { assert.equal(p.labelVisible,false); assert(h.controls.some(x=>x.text==='pJCMAbdomen2Fwd_40' && /#9AC3E3/.test(x.styleSheet||''))); p.value=0.25; }
      else {assert(p.pixmaps && p.pixmaps[0],'Tree hidden marker');h.fire(h.lists()[0],'itemRenamed(DzListViewItem*,int,const QString&)',p,1,'0.25');}
      const tooltip=view==='Controls'?p.toolTip:p.texts[4];
      assert(!tooltip.includes('visibility not authored'));
      assert(!/;\s*$|;\s*;/.test(tooltip),'No empty tooltip delimiter');
      for(let i=0;i<2;i++) {
        h.fire(h.button('Hidden On'),'clicked()');
        assert(!row(h,view,'pJCMAbdomen2Fwd_40'));
        h.fire(h.button('Hidden Off'),'clicked()');
        p=row(h,view,'pJCMAbdomen2Fwd_40');
        assert.equal(view==='Controls'?p.value:p.texts[1],view==='Controls'?0.25:'0.25');
      }
      h.fire(h.button('Used Off'),'clicked()');
      assert(row(h,view,'pJCMAbdomen2Fwd_40'),'Pending nondefault stays Used');
      h.fire(h.button('Hidden On'),'clicked()');
      assert(!row(h,view,'pJCMAbdomen2Fwd_40'),'Hidden filter composes with Used');
      h.fire(h.button('Close'),'clicked()');
    });
  });
}
test('explicit booleans override group fallback, exact root group only, metadata is unchanged',()=>{
  for(const [meta,group,wanted] of [
    [{},'/Hidden/Correctives/Base',true],[{},'Hidden',true],[{},'//hidden//Correctives',true],
    [{},'/Hiddenness/Base',false],[{},'/Pose Controls/Hidden',false],[{},'',false],[{},null,false],[{},7,false],[{},['Hidden'],false],
    [{visible:true},'/Hidden/Base',false],[{hidden:false},'/Hidden/Base',false],
    [{visible:false},'/Pose Controls',true],[{hidden:true},'/Pose Controls',true],
    [{visible:true,hidden:true},'/Hidden',true],[{visible:false,hidden:false},'/Hidden',true]]) {
      const p={meta,morph:{group},label:'Hidden'},before=JSON.stringify(p);
      assert.strictEqual(C.propertyHidden(p),wanted,JSON.stringify(p));
      assert.equal(JSON.stringify(p),before);
  }
  assert.equal(C.propertyHidden({meta:{},label:'Hidden',groups:['Hidden']}),false,'No inference from label/display headings');
});
test('Keys descriptors retain hidden classification from their original morph without changing channel metadata',()=>{
  const s=fixture(),e=s.session().select(0,'DAZ').editor,p=e.order.map(id=>e.props[id]).find(p=>p.morph);
  const before=JSON.stringify(p.meta),keys=context.SceneEditorKeyEditor.create(e);
  const k=keys.order.map(id=>keys.props[id]).find(p=>p.keyframe.source && p.keyframe.source.morph);
  assert(k,'Fixture must bind a saved morph key'); assert(C.propertyHidden(k));
  assert.equal(JSON.stringify(p.meta),before);assert(!Object.hasOwn(k.meta,'hidden'));
  const visible={...k,meta:{...k.meta,visible:true}};assert(!C.propertyHidden(visible));
});
test('visibility marker omits absent metadata and retains actual authored diagnostics',()=>{
  assert.equal(U.visibilityMarker({meta:{}}),'');
  assert.equal(U.visibilityMarker({meta:{visible:false}}),'authored visible=false');
  assert.equal(U.visibilityMarker({meta:{hidden:true}}),'authored hidden=true');
});
for(const view of ['TreeView','Controls']) test(view+': property hover stays concise; TreeView state retains real flags',()=>{
  run(fixture(),view,h=>{
    const p=row(h,view,'Visible translation'),tip=()=>view==='Controls'?p.toolTip:p.texts[4];
    assert(!tip().includes('visibility not authored'));assert(!/;\s*$|;\s*;/.test(tip()));
    if(view==='Controls')p.value=2;else h.fire(h.lists()[0],'itemRenamed(DzListViewItem*,int,const QString&)',p,1,'2');
    if(view==='Controls'){assert(!tip().includes('PENDING'));assert(tip().includes('Alt-click'));assert(tip().includes('Visible translation'));}else assert(tip().includes('PENDING'));assert(!/;\s*$|;\s*;/.test(tip()));
    h.fire(h.button('Hidden Off'),'clicked()');const hidden=row(h,view,'Explicit hidden');
    if(view==='Controls'){assert(hidden.toolTip.includes('Explicit hidden'));assert(!hidden.toolTip.includes('authored visible=false'));}else assert(hidden.texts[4].includes('authored visible=false'));
    h.fire(h.button('Close'),'clicked()');
  });
});
for(const [meta,group] of [[{visible:true},'/Hidden/Correctives'],[{hidden:false},'/Hidden'],[{},'/Pose Controls/Hidden'],[{},'/Hiddenness']])
  for(const view of ['TreeView','Controls']) test(view+': explicit visible or nonreserved group remains shown '+JSON.stringify([meta,group]),()=>{
    run(fixture('DAZ',meta,group),view,h=>{assert(row(h,view,'pJCMAbdomen2Fwd_40'));});
  });

for(const view of ['TreeView','Controls']) test(view+': Keys Hidden toggle and Parameters return use the same classification',()=>{
  run(fixture(),view,h=>{
    h.fire(h.button('Animation'),'clicked()');assert.equal(h.warn.length,0,h.warn.join('\n'));
    assert(!row(h,view,'pJCMAbdomen2Fwd_40'));
    assert(h.controls.some(x=>typeof x.text==='string'&&x.text.includes('1 properties (1 hidden)')));
    h.fire(h.button('Hidden Off'),'clicked()');assert(row(h,view,'pJCMAbdomen2Fwd_40'));
    h.fire(h.button('Hidden On'),'clicked()');assert(!row(h,view,'pJCMAbdomen2Fwd_40'));
    h.fire(h.button('Parameters'),'clicked()');assert(!row(h,view,'pJCMAbdomen2Fwd_40'));
    assert(row(h,view,'Visible translation'));
  },{animationEditing:true});
});
for(const view of ['TreeView','Controls']) test(view+': concise hover omits source details; TreeView state retains diagnostics',()=>{
  const s=fixture('DAZ',{locked:true});s.asset.modifier_library[0].region='Torso';s.asset.modifier_library[0].source='/unresolved#source';
  s.files[s.assetPath]=JSON.stringify(s.asset);s.files['/cache/data/V/Tank.cache.dsf']=JSON.stringify({collection_info:{type:'cache',file_version:'0.6.0.0'},assets:[clone(s.asset)]});
  run(s,view,h=>{
    h.fire(h.button('Hidden Off'),'clicked()');
    const p=view==='TreeView'?row(h,view,'pJCMAbdomen2Fwd_40'):h.controls.find(x=>!x.destroyed&&typeof x.toolTip==='string'&&x.toolTip.includes('pJCMAbdomen2Fwd_40'));
    const tip=view==='TreeView'?p.texts[4]:p.toolTip;
    if(view==='TreeView'){assert(tip.includes('region: Torso'));assert(tip.includes('Modifier source inheritance'));}
    else{assert(tip.includes('pJCMAbdomen2Fwd_40'));assert(!tip.includes('region:'));assert(!tip.includes('Modifier source inheritance'));assert(!tip.includes('authored locked'));}
    assert(!tip.includes('visibility not authored'));assert(!/;\s*$|;\s*;/.test(tip));
  });
});

test('installed bundle and all shipped source tooltips contain no removed phrase',()=>{
  const paths=[path.join(root,'Scene Editor.dsa')];
  function walk(dir){for(const n of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,n.name);if(n.isDirectory())walk(p);else if(n.name.endsWith('.dsa'))paths.push(p);}}
  walk(path.join(root,'support'));
  for(const p of paths)assert(!fs.readFileSync(p,'utf8').includes('visibility not authored'),p);
});
console.log(JSON.stringify({total:results.length,passed:results.filter(x=>x.passed).length,failures:results.filter(x=>!x.passed)},null,2));
if(results.some(x=>!x.passed))process.exitCode=1;

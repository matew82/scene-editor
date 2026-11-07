// Property display-mode regressions. All scenes/assets below are in-memory fixtures.
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
  const dialog=out.controls.find(w=>w.objectName==='SceneEditorObjectProperties-compact500');assert(dialog&&!dialog.deletedLater,'No deferred native dialog destruction queued after return');
  assert.equal(s.files['/scene.duf'], JSON.parse(before)['/scene.duf'], 'No scene writes');
  assert.equal(s.files[s.assetPath], JSON.parse(before)[s.assetPath], 'No asset writes');
  assert.equal(s.files['/cache/data/V/Tank.cache.dsf'], JSON.parse(before)['/cache/data/V/Tank.cache.dsf'], 'No DAZ cache writes');
}
function row(h, view, label) {
  return view === 'TreeView' ? h.lists()[0].items.find(x => x.texts[0] === label) :
    h.controls.find(x => x.label === label && !x.destroyed);
}

for (const view of [undefined,'Controls','PlainControls','TreeView','invalid']) test('initial mode '+view,()=>{
 run(fixture(),view,h=>{
  const isTree=view==='TreeView';
  assert.equal(h.button('TreeView').checked,isTree);
  assert.equal(h.button('Controls').checked,!isTree&&view!=='PlainControls');
  assert.equal(h.button('Plain sliders').checked,view==='PlainControls');
  assert(row(h,isTree?'TreeView':'Controls','Visible translation'));
 });
});
test('repeated decorated/plain/tree transitions preserve pending value and loaded Alt baseline',()=>{
 run(fixture(),'Controls',h=>{
  let p=row(h,'Controls','Visible translation');p.value=2.375;
  for(let i=0;i<3;i++){
   h.fire(h.button('Plain sliders'),'clicked()');
   p=row(h,'Controls','Visible translation');assert.equal(p.value,2.375);assert.equal(p.defaultValue,0);assert.equal(p.restorable,true);assert.equal(p.labelVisible,true);
   assert.equal(h.button('Plain sliders').checked,true);
   h.fire(h.button('TreeView'),'clicked()');assert.equal(row(h,'TreeView','Visible translation').texts[1],'2.375');
   h.fire(h.button('Controls'),'clicked()');p=row(h,'Controls','Visible translation');assert.equal(p.value,2.375);assert.equal(p.defaultValue,0);assert.equal(p.restorable,true);
  }
  h.fire(h.button('Close'),'clicked()');
 });
});
test('same plain mode reuses widgets; switching style constructs the matching view',()=>{
 run(fixture(),'PlainControls',h=>{
  let p=row(h,'Controls','Visible translation');h.fire(h.button('Plain sliders'),'clicked()');assert.strictEqual(row(h,'Controls','Visible translation'),p);
  h.fire(h.button('Controls'),'clicked()');assert.notStrictEqual(row(h,'Controls','Visible translation'),p);
 });
});
for(const view of ['Controls','PlainControls','TreeView'])test('Enter applies and clears property filter in '+view,()=>{
 run(fixture(),view,h=>{const filter=h.controls.find(w=>w.placeholderText==='Filter property name'),button=h.button('Apply filter');
 const enter=h.connections.find(c=>c.o===filter&&c.sig==='returnPressed()'),click=h.connections.find(c=>c.o===button&&c.sig==='clicked()');assert(enter);assert.strictEqual(enter.fn,click.fn);for(const label of ['Save','Close','Apply filter','Parameters','Animation']){const w=h.button(label);if(w)assert.equal(w.autoDefault,false);}
 filter.text='No matching property';h.fire(filter,'returnPressed()');
 assert(!row(h,view,'Visible translation')||row(h,view,'Visible translation').visible===false);
 filter.text='';h.fire(filter,'returnPressed()');assert(row(h,view,'Visible translation'));if(view!=='TreeView')assert.notEqual(row(h,view,'Visible translation').visible,false);
 h.fire(filter,'returnPressed()');
 });
});
test('Animation replaces the Keys mode caption and still switches back to Parameters',()=>{
 run(fixture(),'Controls',h=>{assert(!h.button('Keys'));assert(h.button('Animation'));h.fire(h.button('Animation'),'clicked()');assert(h.button('Animation').checked);h.fire(h.button('Parameters'),'clicked()');assert(h.button('Parameters').checked);},{animationEditing:true});
});
// Exercise the actual Settings dialog with no filesystem-backed settings.
vm.runInNewContext(fs.readFileSync(path.join(root,'support/manager/Scene Editor Manager Settings.dsa'),'utf8'),context);
context.SaveGuardManagerModel={figureNames:n=>n||[]};context.SceneEditorManagerWidgets={applyButtonIcon(){}};
context.SceneEditorBrowserModel={restoreSceneFilters:()=>({}),rememberSceneFilters:s=>s};
function settings(initial,select,accept=true){let stored=clone(initial),widgets=[],links=[],calls=0;
 class W{constructor(){this.font={pointSize:12};widgets.push(this);}getWidget(){return this;}showHelpButton(){}showCancelButton(){}setCancelButtonText(){}setAcceptButtonText(){}setCheckable(){}addWidget(){}addStretch(){}exec(){calls++;assert.equal(calls,1);const expected=initial.propertyView==='TreeView'?'TreeView':initial.propertyView==='PlainControls'?'Plain sliders':'Sliders with icons';assert.equal(widgets.find(w=>w.text===expected).checked,true);if(select){const w=widgets.find(w=>w.text===select);links.find(l=>l.o===w).f();for(const text of ['Sliders with icons','Plain sliders','TreeView'])assert.equal(widgets.find(w=>w.text===text).checked,text===select);}return accept;}}
 const env={DzBasicDialog:W,DzGroupBox:W,DzHBoxLayout:W,DzVBoxLayout:W,DzLabel:W,DzPushButton:W,DzLineEdit:W,DzCheckBox:W,DzWidget:{},connect(o,s,f){links.push({o,s,f});},disconnect(){},MessageBox:{warning(e){throw Error(e);}}};
 const model={getState:()=>({settings:stored}),cacheUsage:()=>({bytes:0,files:0}),setSettings:s=>stored=clone(s)};
 context.SceneEditorManagerSettings.show(env,model,{},'',{});return stored;
}
for(const mode of [undefined,'Controls','PlainControls','TreeView','bad'])test('Settings migration/roundtrip '+mode,()=>{const initial={other:7};if(mode!==undefined)initial.propertyView=mode;const out=settings(initial);assert.equal(out.propertyView,['PlainControls','TreeView'].includes(mode)?mode:'Controls');assert.equal(out.saveSceneFilters,true);assert.equal(out.other,7);});
for(const [label,value] of [['Sliders with icons','Controls'],['Plain sliders','PlainControls'],['TreeView','TreeView']])test('Settings selects '+label,()=>{assert.equal(settings({propertyView:'TreeView'},label).propertyView,value);assert.deepEqual(settings({propertyView:'TreeView'},label,false),{propertyView:'TreeView'});});

test('Missing optional DAZ cache falls back without warning and preserves report detail',()=>{
 const s=fixture();delete s.files['/cache/data/V/Tank.cache.dsf'];const selected=s.session().select(0,'DAZ');assert.equal(selected.editor.propertySource.effective,'Own');assert(selected.editor.propertySource.fallback);assert.equal(selected.diagnostics.length,0);assert(selected.editor.sourceInformation[0].includes('No matching'));
 run(s,'PlainControls',h=>{const button=h.button('Property report');assert(button.enabled);h.fire(button,'clicked()');assert.equal(h.info.length,1);assert(h.info[0].includes('No matching figure/object cache'));assert(h.info[0].includes('object-properties-'));assert(h.controls.some(w=>String(w.text).includes('Property source: Own')));});
});
test('Unreadable DAZ cache still emits actionable diagnostics',()=>{const s=fixture();s.files['/cache/data/V/Tank.cache.dsf']='invalid json';const selected=s.session().select(0,'DAZ');assert(selected.diagnostics.some(s=>s.includes('DAZ cache could not be read')));assert.equal(selected.editor.propertySource.effective,'Own');});

test('Property report opens a compact read-only text viewer',()=>{
 const s=fixture();uiHarness(s,h=>{h.fire(h.button('Property report'),'clicked()');const popup=h.controls.find(w=>w.caption==='Scene Editor - Property report');assert(popup);assert.equal(popup.minWidth,480);assert.equal(popup.minHeight,280);const viewer=h.controls.find(w=>w.parent===popup&&w.readOnly);assert(viewer);assert.equal(viewer.acceptRichText,false);assert(viewer.plainText.includes('object-properties-'));assert(viewer.plainText.includes('Workout Tank')||viewer.plainText.includes('Tank'));assert.equal(h.warn.length,0);},[],true,{textEditor:true,editorOptions:{path:'/scene.duf',objectId:'Tank',settingsManaged:true,propertyView:'PlainControls'}});
});
console.log(JSON.stringify({total:results.length,passed:results.filter(x=>x.passed).length,failures:results.filter(x=>!x.passed),nativeDAZExecuted:false,realScenesModified:false},null,2));
if(results.some(x=>!x.passed))process.exitCode=1;

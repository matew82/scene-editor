const assert=require('assert');
const {m,ctx,env,F,GZ}=require('./helpers/inspection-memory.cjs')();

env.DzFileInfo.prototype.absoluteFilePath=function(){return this.p;};
env.DzFileInfo.prototype.isAbsolute=function(){return /^(?:[A-Za-z]:\/|\/)/.test(this.p);};
env.DzFileInfo.prototype.symLinkTarget=function(){return '';};
const oldRead=F.prototype.read;F.prototype.read=function(n){const b=oldRead.call(this,n);b.convertToString=b.convertToStringFromUtf8;return b;};
let host=ctx.SceneEditorManagerHost.create(env,'C:/SE'),reads=0,count=0;
const scene='C:/scenes/settings.duf',text=JSON.stringify({file_version:'0.6',node_library:[],scene:{nodes:[{id:'n',type:'node'}],current_camera:'#camera',extra:[{type:'studio_scene_settings',animation_settings:{current_frames_per_second:30}}, {type:'other',ignored:true}]}});m.put(scene,text);
const folder=host.cacheFolder(scene),id=host.key(scene),owner={sceneEditor:{schema:1,id,sourcePath:scene,signature:host.signature(scene)}};
function inspect(refresh){return ctx.SaveGuardFastInspect.read(scene,{inspectionCache:true,cacheRefresh:!!refresh,cacheDirectory:folder,cacheVersionId:id,cacheManifest:owner,recognizedCharacterNames:[],onSourceRead(){reads++;}});}
function test(n,f){f();count++;console.log('PASS',n);}
const cache=folder+'/inspection-projection-daz6.json',api=ctx.SaveGuardInspectionCache;

function done(r){assert(!r.error,JSON.stringify(r.error));r.provider.close();return r;}
let diskReads=0,readOwned=api.readOwned;api.readOwned=function(){diskReads++;return readOwned.apply(this,arguments);};
test('recent scene reuses projection without cache JSON read',()=>{done(inspect());const before=diskReads;done(inspect());assert.equal(reads,1);assert.equal(diskReads,before);});
test('forced refresh replaces same-key memory projection',()=>{const render=ctx.SaveGuardRenderSettings,original=render.rows,select=render.selectSource;try{render.selectSource=d=>d;render.rows=()=>[{label:'Fresh projection marker',children:[{label:'Value',value:'updated'}]}];done(inspect(true));const before=diskReads,r=inspect();assert.equal(r.provider.renderDetails().rows[0].label,'Fresh projection marker');done(r);assert.equal(diskReads,before);}finally{render.rows=original;render.selectSource=select;}});
test('explicit invalidation clears session memory but preserves disk cache',()=>{ctx.SaveGuardFastInspect.clearMemory();const before=diskReads,r=done(inspect());assert.equal(r.stats.persistentCacheHit,true);assert(diskReads>before);});
test('source timestamp change cannot reuse session projection',()=>{const prior=reads;let doc=JSON.parse(text);doc.scene.current_camera='#new-camera';m.put(scene,JSON.stringify(doc));owner.sceneEditor.signature=host.signature(scene);let r=inspect();assert.equal(r.stats.persistentCacheHit,false);assert.equal(JSON.parse(m.read(cache)).document.savedSettingsData.scene.current_camera,'#new-camera');done(r);assert.equal(reads,prior+1);});

test('changed motion dependency invalidates memory and disk projections',()=>{const dependency='C:/assets/bone.dsf';m.put(dependency,'old');let record=JSON.parse(m.read(cache));record.document.scene.nodes[0].motionDependencies=[{path:dependency,bytes:3,stamp:String(new env.DzFileInfo(dependency).lastModified())}];m.put(cache,JSON.stringify(record));ctx.SaveGuardFastInspect.clearMemory();done(inspect());const before=reads;m.put(dependency,'new-content');let r=done(inspect());assert.equal(r.stats.persistentCacheHit,false);assert.equal(reads,before+1);});
test('eight-entry memory cache evicts oldest and retains recently recalled scenes',()=>{function run(i){const p='C:/scenes/lru'+i+'.duf';if(!m.exists(p))m.put(p,text);const identity=host.key(p),dir=host.cacheFolder(p),manifest={sceneEditor:{schema:1,id:identity,sourcePath:p,signature:host.signature(p)}};return done(ctx.SaveGuardFastInspect.read(p,{inspectionCache:true,cacheDirectory:dir,cacheVersionId:identity,cacheManifest:manifest,recognizedCharacterNames:[]}));}ctx.SaveGuardFastInspect.clearMemory();for(let i=0;i<8;i++)run(i);let before=diskReads;run(0);assert.equal(diskReads,before);run(8);before=diskReads;run(0);assert.equal(diskReads,before);run(1);assert(diskReads>before);});
console.log(count+' scene-switch projection regressions passed; in-memory scene fixtures only.');

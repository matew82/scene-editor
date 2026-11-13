'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const context={console};vm.createContext(context);
for(const file of ['Scene File Workbench Parameter Compare.dsa','Scene File Workbench Live Compare.dsa'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../support/manager',file),'utf8'),context);
let reads=0,writes=0;
function property(name,value,keys=[]){return {getName:()=>name,className:()=> 'DzFloatProperty',getRawValue:()=>value,getNumKeys:()=>keys.length,getKeyTime:i=>keys[i][0]*4800,getKeyValue:i=>keys[i][1],getKeyInterpolationType:()=>1,isAlias:()=>false,setValue:()=>{writes++;throw Error('Forbidden mutation');}};}
const x=property('XTranslate',12,[[0,1],[1,12]]),h={assetId:'box',getName:()=> 'Box',getLabel:()=> 'Box',getNodeParent:()=>null,getNumProperties:()=>1,getProperty:()=>x,getXPosControl:()=>x};
const source={scene:{nodes:[{id:'box',name:'Box',label:'Box',type:'node',translation:[{id:'x',type:'float',value:1}]}],extra:[{type:'studio_scene_settings',animation_settings:{current_frames_per_second:24}}]}};
const original=JSON.stringify(source),env={DzProperty:{InterpLinear:1},Scene:{getNumNodes:()=>1,getNode:()=>h,getTimeStep:()=>200,getTime:()=>0,getAnimRange:()=>({start:0,end:4800}),getPlayRange:()=>({start:0,end:4800}),setTime:()=>{writes++;throw Error('Forbidden mutation');}},pointersAreEqual:(a,b)=>a===b};
const io={stamp:()=>({version:1}),resolve:f=>f,read:()=>{reads++;return source;}};
const cap=context.SceneEditorLiveCompare.create(env,'saved.duf',io);
assert.equal(cap.path,'live://current');assert.equal(cap.snapshot.document.scene.nodes[0].translation[0].current_value,12);assert.equal(cap.snapshot.document.timeline.fps,24);assert.equal(cap.snapshot.document.scene.nodes[0].translation[0].keys[1][0],1);assert.equal(JSON.stringify(source),original);assert.equal(writes,0);
const result=cap.parameterComparison.compare(['saved.duf',cap.path],[{key:'box',aId:'box',bId:'box'}]);
assert(result.incomplete.box);assert(result.details.box.some(x=>x.label==='x'&&x.status==='Changed'));assert(result.details.box.some(x=>x.section==='Materials'&&x.status==='Unknown'));assert.equal(writes,0);
// Unsupported native channels must never inherit the saved value as live truth.
delete h.getXPosControl;h.getNumProperties=()=>0;
const unknown=context.SceneEditorLiveCompare.create(env,'saved.duf',io);assert.equal(unknown.snapshot.document.scene.nodes[0].translation[0].type,'alias');assert(!('current_value' in unknown.snapshot.document.scene.nodes[0].translation[0]));
// A live-only object is an actual addition, not silently omitted.
const extra={getName:()=> 'Extra',getLabel:()=> 'Extra',inherits:()=>false};env.Scene.getNumNodes=()=>2;env.Scene.getNode=i=>i?h:extra;
assert.equal(context.SceneEditorLiveCompare.create(env,'saved.duf',io).snapshot.document.scene.nodes.length,2);
assert.equal(writes,0);console.log('Live comparison: read-only capture, values, key times, unsupported coverage and additions PASS');
// Additional runtime properties are visible, with an honest unknown saved counterpart.
const custom=property('CustomLive',7);h.getXPosControl=()=>x;h.getNumProperties=()=>2;h.getProperty=i=>i?custom:x;env.Scene.getNumNodes=()=>1;env.Scene.getNode=()=>h;
const additional=context.SceneEditorLiveCompare.create(env,'saved.duf',io),additionalRows=additional.parameterComparison.compare(['saved.duf',additional.path],[{key:'box',aId:'box',bId:'box'}]).details.box;
assert(additionalRows.some(r=>r.label==='CustomLive'&&r.status==='Unknown'&&r.valueB===7));
// Material scalar values can be compared without claiming shader/map equivalence.
const rough=property('Roughness',0.8),mat={getName:()=> 'Skin',getNumProperties:()=>1,getProperty:()=>rough};h.getObject=()=>({getCurrentShape:()=>({getNumMaterials:()=>1,getMaterial:()=>mat})});
source.scene.nodes[0].geometries=[{id:'geo'}];source.scene.materials=[{id:'surface',geometry:'#geo',groups:['Skin'],extra:[{type:'studio/material/test',channels:[{id:'Roughness',type:'float',value:0.2}]}]}];
const materialCapture=context.SceneEditorLiveCompare.create(env,'saved.duf',io),materialRows=materialCapture.parameterComparison.compare(['saved.duf',materialCapture.path],[{key:'box',aId:'box',bId:'box'}]).details.box;
assert(materialRows.some(r=>r.section==='Materials'&&r.label==='Roughness'&&r.status==='Changed'&&r.valueB===0.8));assert(materialRows.some(r=>r.section==='Materials'&&r.status==='Unknown'));
assert.equal(writes,0);console.log('Additional live properties + material numeric values PASS');
const color={getName:()=> 'Tint',className:()=> 'DzColorProperty',getRawColorValue:()=>({red:255,green:128,blue:0}),getNumKeys:()=>0,isAlias:()=>false};h.getNumProperties=()=>3;h.getProperty=i=>i===2?color:i?custom:x;
const colorCapture=context.SceneEditorLiveCompare.create(env,'saved.duf',io),extraChannels=colorCapture.snapshot.document.scene.nodes[0].extra.find(x=>x.type==='live/additional_properties').channels;
assert.deepEqual(Array.from(extraChannels.find(x=>x.id==='Tint').current_value),[1,128/255,0]);console.log('Native QColor-to-DSON normalization PASS');
// Saved-root reparenting and parent removal must use live parentage.
const parent={assetId:'parent',getName:()=> 'Parent',getLabel:()=> 'Parent',inherits:()=>false,getNodeParent:()=>null};h.getNodeParent=()=>parent;env.Scene.getNumNodes=()=>2;env.Scene.getNode=i=>i?parent:h;
const reparent=context.SceneEditorLiveCompare.create(env,'saved.duf',io),rn=reparent.snapshot.document.scene.nodes;
assert.equal(rn.find(n=>n.id==='box').parent,'#'+rn.find(n=>n.name==='Parent').id);
source.scene.nodes[0].parent='#oldSavedParent';h.getNodeParent=()=>null;
const unparent=context.SceneEditorLiveCompare.create(env,'saved.duf',io);assert(!('parent' in unparent.snapshot.document.scene.nodes.find(n=>n.id==='box')));
// A same-name replacement with another external asset is not a match.
delete source.scene.nodes[0].parent;source.scene.nodes[0].url='/data/Original.dsf#asset';h.assetSource='/data/Replacement.dsf#asset';
const replacement=context.SceneEditorLiveCompare.create(env,'saved.duf',io);assert(!replacement.snapshot.document.scene.nodes.some(n=>n.id==='box'));assert(replacement.issues.some(x=>x.includes('asset identities')));
delete source.scene.nodes[0].url;delete h.assetSource;
console.log('Live parent reconstruction and external asset mismatch PASS');
source.scene.nodes[0].url='/data/Original.dsf#asset';delete h.assetSource;
const uncertain=context.SceneEditorLiveCompare.create(env,'saved.duf',io);assert(uncertain.unresolvedSavedIds.includes('box'));assert.equal(uncertain.unresolvedLiveIds.length,1);
h.assetSource='/data/Replacement.dsf#asset';const knownDifferent=context.SceneEditorLiveCompare.create(env,'saved.duf',io);assert.equal(knownDifferent.unresolvedSavedIds.length,0);assert.equal(knownDifferent.unresolvedLiveIds.length,0);
console.log('Unverified versus known-different identity coverage PASS');
// Native lights inherit cameras. Both matched and live-only classification must prioritize light.
const light={getName:()=> 'Window Light Base',getLabel:()=> 'Window Light Base',inherits:t=>t==='DzLight'||t==='DzCamera',getNodeParent:()=>null};env.Scene.getNumNodes=()=>1;env.Scene.getNode=()=>light;
const liveLight=context.SceneEditorLiveCompare.create(env,'saved.duf',io);assert.equal(liveLight.snapshot.document.scene.nodes[0].type,'light');console.log('DzLight before DzCamera classification PASS');
// Active viewport camera is mapped by native pointer to its captured ID, not by a copied saved reference.
const camera={getName:()=> 'LiveCamera',getLabel:()=> 'Camera current',inherits:t=>t==='DzCamera',getNodeParent:()=>null};env.Scene.getNode=()=>camera;env.MainWindow={getViewportMgr:()=>({getActiveViewport:()=>({get3DViewport:()=>({getCamera:()=>camera})})})};
const activeCapture=context.SceneEditorLiveCompare.create(env,'saved.duf',io);assert.equal(activeCapture.snapshot.document.savedSceneInfo.camera.id,activeCapture.snapshot.document.scene.nodes[0].id);assert.equal(activeCapture.snapshot.document.savedSceneInfo.camera.label,'Camera current');console.log('Active viewport pointer-to-captured-ID mapping PASS');
// Built-in Perspective is a real view identity, not an invented scene node.
const perspective={getName:()=> 'PerspectiveView',getLabel:()=> 'Perspective View',className:()=> 'DzBasicCamera',inherits:t=>t==='DzCamera',isViewCamera:()=>true};env.MainWindow.getViewportMgr=()=>({getActiveViewport:()=>({get3DViewport:()=>({getCamera:()=>perspective})})});
assert.equal(context.SceneEditorLiveCompare.create(env,'saved.duf',io).snapshot.document.savedSceneInfo.camera.builtin,true);
// Local definition ID differs from saved serialization ID and must identify the correct live source.
const localSource={node_library:[{id:'SpotLight',name:'SpotLight',label:'Window',type:'light'}],scene:{nodes:[{id:'SpotLight-6',url:'#SpotLight',name:'SpotLight',label:'Window'}]}};
const localLight={assetId:'SpotLight',getName:()=> 'SpotLight',getLabel:()=> 'Window',getNodeParent:()=>null,getNumProperties:()=>0,inherits:t=>t==='DzLight'||t==='DzCamera'};env.Scene.getNode=()=>localLight;const localCap=context.SceneEditorLiveCompare.create(env,'local.duf',{read:()=>localSource,resolve:p=>p,stamp:()=>1});assert.equal(localCap.snapshot.document.scene.nodes[0].id,'SpotLight-6');assert.equal(localCap.unresolvedSavedIds.length,0);console.log('Built-in viewport and local definition identity PASS');
// A nonempty but unusable assetSource must not hide a verified assetUri.
const validSource={scene:{nodes:[{id:'asset',name:'Same',label:'Second',type:'node',url:'/data/verified.dsf#asset'}]}};
function repeated(label){return {assetId:'asset',assetSource:'not-an-external-reference',assetUri:'/data/verified.dsf#asset',getName:()=> 'Same',getLabel:()=>label,getNodeParent:()=>null,getNumProperties:()=>0,inherits:()=>false};}
const first=repeated('First'),second=repeated('Second');env.Scene.getNumNodes=()=>2;env.Scene.getNode=i=>i?second:first;
const repeatedCap=context.SceneEditorLiveCompare.create(env,'repeated.duf',{read:p=>p==='repeated.duf'?validSource:{node_library:[{id:'asset',name:'Same',type:'node'}]},resolve:p=>p,stamp:()=>1});assert(repeatedCap.snapshot.document.scene.nodes.some(n=>n.id==='asset'&&n.label==='Second'));assert.equal(repeatedCap.unresolvedSavedIds.length,0);console.log('Verified secondary URI and structural duplicate identity PASS');
// Service fast path performs no file/property reads. Details read selected objects only on explicit comparison.
let fastReads=0,selectedReads=0,otherReads=0;
const selectedProperty=property('XTranslate',9),selectedNode={assetId:'selected',getName:()=> 'Selected',getLabel:()=> 'Selected',getNodeParent:()=>null,inherits:()=>false,getNumProperties:()=>{selectedReads++;return 1;},getProperty:()=>selectedProperty,getXPosControl:()=>selectedProperty};
const otherNode={assetId:'other',getName:()=> 'Other',getLabel:()=> 'Other',getNodeParent:()=>null,inherits:()=>false,getNumProperties:()=>{otherReads++;throw Error('Unselected properties must not be read');}};
const lazySource={scene:{nodes:[{id:'selected',name:'Selected',label:'Selected',type:'node',translation:[{id:'x',type:'float',value:1}]},{id:'other',name:'Other',label:'Other',type:'node'}]}};
const lazyIO={read:()=>{fastReads++;return lazySource;},resolve:p=>{throw Error('Unexpected definition read '+p);},stamp:()=>1};env.Scene.getNumNodes=()=>2;env.Scene.getNode=i=>i?otherNode:selectedNode;
const lazy=context.SceneEditorLiveCompare.create(env,'lazy.duf',lazyIO,()=>{},lazySource);assert.equal(fastReads,0);assert.equal(selectedReads,0);assert.equal(otherReads,0);
const lazyRows=lazy.parameterComparison.compare(['lazy.duf',lazy.path],[{key:'selected',aId:'selected',bId:'selected'}]).details.selected;assert(lazyRows.some(r=>r.label==='x'&&r.valueB===9&&r.status==='Changed'));assert(selectedReads>0);assert.equal(otherReads,0);assert(fastReads>0);console.log('Zero-read fast capture and selected-only lazy detail PASS');
// Fresh native parent wrappers: resolve pointers only within a narrow identity bucket, never all N nodes.
const manySource={scene:{nodes:[]}},many=[];let pointerCalls=0,manyReads=0;function wrap(i){return {_ptr:i,assetId:'N'+i,getName:()=> 'N'+i,getLabel:()=> 'N'+i,inherits:()=>false,getNodeParent:()=>i===0?null:wrap(0),getNumProperties:()=>{manyReads++;throw Error('Property reads forbidden');}};}
for(let i=0;i<80;i++){many.push(wrap(i));manySource.scene.nodes.push({id:'N'+i,name:'N'+i,label:'N'+i,type:'node',...(i?{parent:'#N0'}:{})});}
env.Scene.getNumNodes=()=>many.length;env.Scene.getNode=i=>many[i];env.pointersAreEqual=(a,b)=>{pointerCalls++;return a._ptr===b._ptr;};
const manyCap=context.SceneEditorLiveCompare.create(env,'many.duf',{read:()=>{throw Error('No IO');},resolve:()=>{throw Error('No resolve');},stamp:()=>1},()=>{},manySource);assert.equal(manyReads,0);assert(pointerCalls<=many.length*2,'Pointer comparison must remain linear');assert.equal(manyCap.snapshot.document.scene.nodes[79].parent,'#N0');
let cancelled=false;try{lazy.parameterComparison.compare(['lazy.duf',lazy.path],[{key:'selected',aId:'selected',bId:'selected'}],()=>{const e=Error('cancelled');e.code='CANCELLED';throw e;});}catch(e){cancelled=e.code==='CANCELLED';}assert(cancelled);console.log('Fresh parent wrappers linear pointer budget and cancellation PASS');

// A saved modifier control must not also appear as an unrepresented live-only property.
const morphProp=property('KnownMorph',0.75),unrepresented=property('ActuallyLiveOnly',2);
const morphNode={assetId:'figure',getName:()=> 'Figure',getLabel:()=> 'Figure',getNodeParent:()=>null,inherits:()=>false,getNumProperties:()=>2,getProperty:i=>i?unrepresented:morphProp};
const morphDoc={scene:{nodes:[{id:'figure',name:'Figure',label:'Figure',type:'node'}],modifiers:[{id:'morph',name:'KnownMorph',parent:'#figure',channel:{id:'value',type:'float',value:0.25}}]}};
env.Scene.getNumNodes=()=>1;env.Scene.getNode=()=>morphNode;env.pointersAreEqual=(a,b)=>a===b;
const morphCap=context.SceneEditorLiveCompare.create(env,'morph.duf',{read:()=>morphDoc,resolve:p=>p,stamp:()=>1});
const morphRows=morphCap.parameterComparison.compare(['morph.duf',morphCap.path],[{key:'figure',aId:'figure',bId:'figure'}]).details.figure;
assert(!morphCap.snapshot.document.scene.nodes[0].extra.find(e=>e.type==='live/additional_properties').channels.some(c=>c.id==='KnownMorph'));
assert(morphRows.some(r=>r.label==='KnownMorph'&&r.valueB===0.75&&r.status==='Changed'));
assert(morphRows.some(r=>r.label==='ActuallyLiveOnly'&&r.status==='Unknown'));
// Animation API failure does not erase a valid current raw value.
morphProp.getNumKeys=()=>{throw Error('No key API');};
const partialCap=context.SceneEditorLiveCompare.create(env,'morph.duf',{read:()=>morphDoc,resolve:p=>p,stamp:()=>1});
assert.equal(partialCap.snapshot.document.scene.modifiers[0].channel.current_value,0.75);
assert.equal(partialCap.snapshot.document.scene.modifiers[0].channel.type,'float');
const partialRows=partialCap.parameterComparison.compare(['morph.duf',partialCap.path],[{key:'figure',aId:'figure',bId:'figure'}]).details.figure;
assert(partialRows.some(r=>r.label==='KnownMorph'&&r.valueB===0.75&&r.animation.some(k=>k.status==='Unknown')));
console.log('Known modifier duplicate exclusion and independent unknown animation PASS');

// Native aliases and inherited property classes are read through their verified targets/types.
morphProp.getNumKeys=()=>0;
const alias={getName:()=> 'KnownMorph',className:()=> 'DzFloatPropertyAlias',inherits:t=>t==='DzFloatProperty',isAlias:()=>true,getAliasTarget:()=>morphProp};
morphNode.getNumProperties=()=>1;morphNode.getProperty=()=>alias;
const aliasCap=context.SceneEditorLiveCompare.create(env,'morph.duf',{read:()=>morphDoc,resolve:p=>p,stamp:()=>1});
assert.equal(aliasCap.snapshot.document.scene.modifiers[0].channel.current_value,0.75);
alias.getAliasTarget=()=>alias;
const cyclicCap=context.SceneEditorLiveCompare.create(env,'morph.duf',{read:()=>morphDoc,resolve:p=>p,stamp:()=>1});assert.equal(cyclicCap.snapshot.document.scene.modifiers[0].channel.type,'alias');assert(!('current_value' in cyclicCap.snapshot.document.scene.modifiers[0].channel));
const inheritedColor={getName:()=> 'KnownMorph',className:()=> 'PluginColorProperty',inherits:t=>t==='DzColorProperty',getRawColorValue:()=>({red:255,green:128,blue:0}),getNumKeys:()=>0};morphNode.getProperty=()=>inheritedColor;morphDoc.scene.modifiers[0].channel.type='color';
const inheritedCap=context.SceneEditorLiveCompare.create(env,'morph.duf',{read:()=>morphDoc,resolve:p=>p,stamp:()=>1});assert.deepEqual(Array.from(inheritedCap.snapshot.document.scene.modifiers[0].channel.current_value),[1,128/255,0]);
console.log('Native alias target, cycle rejection and inherited color property PASS');

// Real DzNodeProperty references bind through captured pointer identity, never labels.
const refTarget={assetId:'refTarget',getName:()=> 'Target',getLabel:()=> 'Target',getNodeParent:()=>null,inherits:()=>false,getNumProperties:()=>0};
const nodeProp={getName:()=> 'KnownMorph',className:()=> 'DzNodeProperty',getValue:()=>refTarget,getNumKeys:()=>0};
morphNode.getProperty=()=>nodeProp;env.Scene.getNumNodes=()=>2;env.Scene.getNode=i=>i?refTarget:morphNode;morphDoc.scene.nodes.push({id:'refTarget',name:'Target',label:'Target',type:'node'});morphDoc.scene.modifiers[0].channel={id:'value',type:'node',value:'#refTarget'};
const refCap=context.SceneEditorLiveCompare.create(env,'morph.duf',{read:()=>morphDoc,resolve:p=>p,stamp:()=>1});assert.equal(refCap.snapshot.document.scene.modifiers[0].channel.current_value,'#refTarget');
nodeProp.getValue=()=>null;const nullCap=context.SceneEditorLiveCompare.create(env,'morph.duf',{read:()=>morphDoc,resolve:p=>p,stamp:()=>1});assert.strictEqual(nullCap.snapshot.document.scene.modifiers[0].channel.current_value,null);
nodeProp.getValue=()=>({});const outsideCap=context.SceneEditorLiveCompare.create(env,'morph.duf',{read:()=>morphDoc,resolve:p=>p,stamp:()=>1});assert.equal(outsideCap.snapshot.document.scene.modifiers[0].channel.type,'alias');
console.log('Captured node pointer references, null and outside-capture rejection PASS');

// Alias to another owner must not suppress an unrelated local namesake of its target.
const foreignTarget=property('ForeignName',3),localNamesake=property('ForeignName',9),crossAlias={getName:()=> 'KnownMorph',className:()=> 'DzFloatPropertyAlias',isAlias:()=>true,getAliasTarget:()=>foreignTarget};
morphNode.getNumProperties=()=>2;morphNode.getProperty=i=>i?localNamesake:crossAlias;morphDoc.scene.modifiers[0].channel={id:'value',type:'float',value:1};
const crossCap=context.SceneEditorLiveCompare.create(env,'morph.duf',{read:()=>morphDoc,resolve:p=>p,stamp:()=>1});assert.equal(crossCap.snapshot.document.scene.modifiers[0].channel.current_value,3);assert(crossCap.snapshot.document.scene.nodes[0].extra.find(e=>e.type==='live/additional_properties').channels.some(c=>c.id==='ForeignName'&&c.current_value===9));
console.log('Cross-owner alias leaves unrelated local target-name property visible PASS');

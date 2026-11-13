const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),c={SaveGuardSettings:{characterNames:[]}};
for(const n of ['SaveGuard Light Assemblies','SaveGuard Fast Inspect','Scene File Workbench Compare','Scene File Workbench Compare Transfer'])vm.runInNewContext(fs.readFileSync(path.join(root,'support/manager',n+'.dsa'),'utf8'),c);
function snapshot(value){return {ok:true,document:{node_library:[],scene:{nodes:[],extra:[]},emission:{objects:[]},renderDetails:{rows:[{label:'Dimensions',children:[{label:'Image size (pixels)',value:value}]}]}}};}
let a=snapshot('100, 200'),b=snapshot('300, 400'),rows=c.SceneEditorCompare.compare(a,b),r=rows.find(x=>x.property==='Image size (pixels)');
assert(r.transfer);assert.equal(r.transfer.kind,'renderSetting');assert.deepEqual(Array.from(r.transfer.path),['Dimensions','Image size (pixels)']);assert.equal(r.transfer.valueA,'100, 200');assert.equal(r.transfer.valueB,'300, 400');assert.equal(r.transfer.status,'Changed');assert(!rows.find(x=>x.property==='Dimensions').transfer);
assert(c.SceneEditorCompare.parameterRows(rows,{}) .find(x=>x.transfer).transfer===r.transfer);
b.partialLive=true;assert(!c.SceneEditorCompare.compare(a,b).some(x=>x.transfer));delete b.partialLive;b.document.renderDetails.rows=[];assert(!c.SceneEditorCompare.compare(a,b).some(x=>x.transfer));
let calls=[];c.SceneEditorRenderTransfer={reason(d,dir){calls.push(['reason',d,dir]);return '';},selectionEligibility(ds,dir){calls.push(['selection',ds,dir]);return {allowed:true};},prepare(io,paths,ds,dir,g){calls.push(['prepare',ds,dir]);return {kind:'renderSettings'};}};
const t=c.SceneEditorCompareTransfer;assert(t.eligible(r.transfer,1));assert(t.selectionEligibility([r.transfer],1).allowed);assert.equal(t.prepare({},['A','B'],[r.transfer],1).kind,'renderSettings');assert.equal(calls[0][2],1);assert.equal(calls[1][2],1);assert.equal(calls[2][2],1);
assert(!t.selectionEligibility([r.transfer,{typeA:'float',typeB:'float'}],0).allowed);assert.throws(()=>t.prepare({},['A','B'],[r.transfer,{kind:'animationKey'}],0),/separately/);
const source=fs.readFileSync(path.join(root,'support/manager/Scene File Workbench Compare.dsa'),'utf8');assert(source.includes("plan.kind==='renderSettings'?'Transfer render settings'"));assert(source.includes('Other scene data and animation are not copied.'));
console.log('PASS render row binding, grouping, live/missing exclusion, parameter expansion, direction delegation, mixed rejection and confirmation wording');

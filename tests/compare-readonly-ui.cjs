const fs=require('fs'),vm=require('vm'),path=require('path');
let source=fs.readFileSync(path.join(__dirname,'compare-transfer-ui.cjs'),'utf8');
const start=source.indexOf("for(const name of ['Copy values A to B'");
const end=source.indexOf("assert(!button('Remove B from comparison'));",start);
if(start<0||end<0)throw Error('Fixture toolbar changed');
source=source.slice(0,start)+"assert(!button('Copy values A to B'));assert(!button('Copy values B to A'));"+source.slice(end);
source=source.replace("{onError(e,meta){", "{readOnly:true,notice:'Live snapshot limitations',columnLabels:['A: Saved','B: Live scene'],onError(e,meta){");
source=source.replace("c.SceneEditorCompare.show(env", "delete c.SceneEditorCompareTransfer;delete c.SceneEditorIO;delete c.SaveGuardExplicitConfirmation;c.SceneEditorCompare.show(env");
source=source.replace("['normal','cancel','close','sourcechange','transfer','deny','blocked','direction','mixed','keytransfer','keydeny','columns']", "['normal','cancel','close','sourcechange','columns']");
new Function('require','__dirname',source)(require,__dirname);
console.log('PASS read-only comparison has no transfer widgets, eligibility, IO, confirmation or mutation dependencies');

const context={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../support/manager/Scene File Workbench Compare.dsa'),'utf8'),context);const summary=context.SceneEditorCompare.comparisonSummary([{key:'x',eligible:true}],{x:[]},[],[{ok:true},{ok:true,partialLive:true}]);if(summary.mode!=='Partial'||!summary.partialLive)throw Error('Live cannot claim full Detailed coverage');if(context.SceneEditorCompare.readOnlyComparisonVersion!==1)throw Error('Missing read-only capability marker');

let unresolvedSource=source.replace("{readOnly:true,notice:","{readOnly:true,unresolvedIds:[['absent'],[]],notice:").replace("c.SceneEditorCompare.show(env","const unresolvedResult=c.SceneEditorCompare.show(env").replace("assert.equal(links.length,0);","assert.equal(unresolvedResult.rows.find(r=>r.aId==='absent').status,'Unknown');assert.equal(unresolvedResult.rows.find(r=>r.aId==='absent').eligible,false);assert.equal(links.length,0);");new Function('require','__dirname',unresolvedSource)(require,__dirname);

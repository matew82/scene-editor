const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');function dimensions(name){const b=fs.readFileSync(path.join(root,'icons',name+'.png'));assert(b.length>24);assert.equal(b.subarray(1,4).toString(),'PNG');return[b.readUInt32BE(16),b.readUInt32BE(20)];}
for(const name of ['Expand Differences','Select All','Unselect All','Compare Selected']){const prefix='Scene File Workbench Comparison '+name;assert.deepEqual(dimensions(prefix),[48,48]);const source=dimensions(prefix+' Source');assert(source[0]>48&&source[1]>48);}
for(const name of ['Expand','Collapse'])assert.deepEqual(dimensions('Scene File Workbench Action '+name),[48,48]);
console.log('PASS six toolbar icons, four full-size generated sources and exact 48px assets');

const pane=fs.readFileSync(path.join(root,'support/manager/Scene File Workbench Inspection Pane.dsa'),'utf8');assert(pane.includes('row.spacing=6'));assert(/row\.addWidget\(collapse\);if\(target\.key!=='render'\)row\.addSpacing\(14\);[\s\S]{0,100}row\.addWidget\(editButton\)/.test(pane));
for(const name of ['Copy A to B','Copy B to A']){const prefix='Scene File Workbench Comparison '+name;assert.deepEqual(dimensions(prefix),[96,48]);const source=dimensions(prefix+' Source');assert(source[0]>96&&source[1]>48);}
console.log('PASS directional transfer icons96x48 and original sources');

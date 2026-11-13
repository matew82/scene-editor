// In-memory checks only; no DAZ/Explorer launch or real scene changes.
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm'),Module=require('module');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'support/manager/Scene File Workbench Manager Main.dsa'),'utf8');
const ac=new Module('acorn');ac._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],'acorn');
const ast=ac.exports.parse(source,{ecmaVersion:3,allowReserved:false});ac.exports.parse(source,{ecmaVersion:5});
function all(n,p,out=[]){if(!n||typeof n!=='object')return out;if(p(n))out.push(n);for(const v of Object.values(n)){if(Array.isArray(v))for(const c of v)all(c,p,out);else if(v&&typeof v==='object')all(v,p,out);}return out;}
const node=all(ast,n=>n.type==='FunctionDeclaration'&&n.id.name==='revealSelectedScene')[0];assert(node);
function setup(opts={}){const c={closing:false,busy:false,externalBusy:false,mutating:false,selected:'D:/Scenes/Scene.duf',calls:[],warnings:[]};c.env={DzFileInfo:function(p){this.exists=()=>!opts.missing;this.isFile=()=>!opts.directory;},App:{showInNativeBrowser(p){c.calls.push(p);if(opts.error)throw Error('Native failure');return opts.result!==false;}}};if(opts.noApi)delete c.env.App.showInNativeBrowser;c.warn=(e,m)=>c.warnings.push({message:e.message,meta:m});vm.createContext(c);vm.runInContext(source.slice(node.start,node.end),c);return c;}
let passed=0;function test(n,f){f();passed++;console.log('PASS '+n);}
for(const p of ['D:/Scenes/Scene.duf','D:\\Scenes Folder\\Scene #1 & 100%.duf','\\\\server\\share\\Scenes Folder\\Lisa.duf','//server/share/Scene.duf','D:/Scenes/\u041b\u0438\u0437\u0430.duf'])test('literal path '+p,()=>{const c=setup();c.selected=p;c.revealSelectedScene();assert.deepEqual(c.calls,[p]);assert.equal(c.warnings.length,0);});
test('repeat clicks and new selection after rename',()=>{const c=setup();c.revealSelectedScene();c.revealSelectedScene();c.selected='D:/Scenes/Renamed.duf';c.revealSelectedScene();assert.deepEqual(c.calls,['D:/Scenes/Scene.duf','D:/Scenes/Scene.duf',c.selected]);});
for(const flag of ['closing','busy','externalBusy','mutating'])test('ignore click while '+flag,()=>{const c=setup();c[flag]=true;c.revealSelectedScene();assert.equal(c.calls.length,0);assert.equal(c.warnings.length,0);});
test('empty selection',()=>{const c=setup();c.selected='';c.revealSelectedScene();assert.equal(c.calls.length,0);});
for(const option of ['missing','directory','noApi','error'])test('report '+option,()=>{const c=setup({[option]:true});c.revealSelectedScene();assert.equal(c.warnings.length,1);assert.equal(c.warnings[0].meta.action,'openSceneFolder');if(option!=='error')assert.equal(c.calls.length,0);});
test('native failure is reported',()=>{const c=setup({result:false});c.revealSelectedScene();assert.equal(c.warnings.length,1);});
test('selection and busy enabled wiring',()=>assert(source.includes('openSceneFolder.enabled=!active&&has;')));
test('managed callback disconnect on close',()=>assert(source.includes("connect(openSceneFolder,'clicked()',revealSelectedScene);")));
test('existing folder artwork available',()=>assert(fs.existsSync(path.join(root,'icons/Scene File Workbench Folder Gallery.png'))));
test('bundle contains current manager',()=>assert(fs.readFileSync(path.join(root,'Scene File Workbench.dsa'),'utf8').includes(source.replace(/\r\n/g,'\n'))));
console.log(JSON.stringify({passed,nativeDAZExecuted:false,realScenesModified:false}));

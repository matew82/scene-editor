// In-memory Scene Information header regressions. No DAZ process, scene access, or writes.
// These checks validate layout wiring and text; native pixel geometry is a separate check.
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm'),Module=require('module');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'support/manager/Scene File Workbench Manager Main.dsa'),'utf8');
const ac=new Module('acorn');ac._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],'acorn');
const ast=ac.exports.parse(source,{ecmaVersion:3,allowReserved:false});
function all(node,predicate,out=[]){if(!node||typeof node!=='object')return out;if(predicate(node))out.push(node);for(const value of Object.values(node)){if(Array.isArray(value))for(const child of value)all(child,predicate,out);else if(value&&typeof value==='object')all(value,predicate,out);}return out;}
function fn(name){const nodes=all(ast,n=>n.type==='FunctionDeclaration'&&n.id.name===name);assert.equal(nodes.length,1);return source.slice(nodes[0].start,nodes[0].end);}
const headerStart=source.indexOf('var titleRow=plainPanel('),headerEnd=source.indexOf('var infoText=label(',headerStart);
assert(headerStart>=0&&headerEnd>headerStart);
const update=fn('updateInfo'),updateHeader=update.slice(update.indexOf('{')+1,update.indexOf('for(var mf='));
assert(updateHeader.includes('sceneHeading.text=selected?sceneTitle(selected)'));
function layout(){return{widgets:[],addWidget(widget,stretch){this.widgets.push({widget,stretch});},addStretch(stretch){this.widgets.push({stretch});}};}
function setup(){
 const c={root:'C:/Scene File Workbench',selected:'',env:{DzLabel:{RichText:1},DzWidget:{ElideNone:3,AlignLeft:1,AlignTop:32},DzFileInfo:class{constructor(p){this.path=p;}fileName(){return this.path.split('/').pop();}}},infoPage:{widget:{},layout:layout()},
 plainPanel(parent){return{widget:{parent},layout:layout()};},label(parent,text){return{parent,text};},button(parent,text){return{parent,text};},
 SceneEditorManagerWidgets:{applyIcon(env,control,path,title,options){control.width=control.height=options.buttonSize;control.iconSize=options.iconSize;control.toolTip=title;}}};
 vm.createContext(c);vm.runInContext(fn('esc')+';'+fn('sceneTitle')+';'+source.slice(headerStart,headerEnd)+';this.updateHeader=function(){'+updateHeader+'};',c);return c;
}
let passed=0;function test(name,run){run();passed++;console.log('PASS '+name);}
function check(c,name){
 const row=c.titleRow.layout.widgets;
 assert.equal(row.length,4,'Keep the compact title/rename/folder group and trailing stretch');
 assert.strictEqual(row[0].widget,c.sceneHeading);assert.equal(row[0].stretch,0);
 assert.strictEqual(row[1].widget,c.rename);assert.equal(row[1].stretch,0);assert.strictEqual(row[2].widget,c.openSceneFolder);assert.equal(row[2].stretch,0);assert.equal(row[3].stretch,1);
 assert.strictEqual(c.rename.parent,c.sceneHeading.parent);
 assert.equal(c.rename.width,26);assert.equal(c.rename.height,26);assert.equal(c.rename.iconSize,20);
 assert.equal(c.sceneHeading.minWidth,1);assert.equal(c.sceneHeading.maxWidth,undefined);
 assert.equal(c.sceneHeading.wordWrap,false);assert.equal(c.sceneHeading.elideMode,c.env.DzWidget.ElideNone);
 assert(c.sceneHeading.text.includes(name.replace(/\.duf$/i,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')));
}
for(const name of ['Wearable Manager Promo 2.duf','A very long scene filename with spaces that can wrap when the pane becomes narrow.duf','Scene & <literal> '+String.fromCharCode(0x0416,0x65e5)+'.duf']){
 test('scene title stays single line: '+name,()=>{
  const c=setup();assert.equal(c.titleRow.widget.visible,false);c.selected='C:/Scenes/'+name;c.updateHeader();check(c,name);
  const html=c.sceneHeading.text;for(const width of [300,680,1000,420]){c.titleRow.widget.width=width;c.updateHeader();check(c,name);assert.equal(c.sceneHeading.text,html);}
  c.selected='C:/Scenes/Other.duf';c.updateHeader();check(c,'Other.duf');c.selected='C:/Scenes/'+name;c.updateHeader();check(c,name);
  c.selected='';c.updateHeader();assert.equal(c.titleRow.widget.visible,false);assert.equal(c.sceneHeading.text,'');
 });
}
test('bottom actions reserve their own height below the expanding spacer',()=>{
 const footer=source.slice(source.indexOf('var sceneBar=plainPanel('),source.indexOf('var backupStatus=label('));
 const c={infoPage:{layout:layout()},sceneBar:{widget:{setFixedHeight(n){this.minHeight=this.maxHeight=n;}}}};
 vm.createContext(c);const tail=footer.slice(footer.indexOf('infoPage.layout.addStretch(1);'));
 vm.runInContext(tail,c);
 assert.equal(c.sceneBar.widget.minHeight,52);assert.equal(c.sceneBar.widget.maxHeight,52);
 assert.equal(c.infoPage.layout.widgets[0].stretch,1);assert.strictEqual(c.infoPage.layout.widgets[1].widget,c.sceneBar.widget);assert.equal(c.infoPage.layout.widgets[1].stretch,0);
});

test('ES3 and ES5 compatibility',()=>ac.exports.parse(source,{ecmaVersion:5}));
test('bundle contains exact current manager',()=>assert(fs.readFileSync(path.join(root,'Scene File Workbench.dsa'),'utf8').includes(source.replace(/\r\n/g,'\n'))));
console.log(JSON.stringify({passed,nativeDAZExecuted:false,realScenesModified:false}));

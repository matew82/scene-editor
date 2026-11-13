// Backup heading/render regressions. In-memory widgets only; no DAZ or real scene access.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert'), Module = require('module');
const root = path.resolve(__dirname, '..'), source = fs.readFileSync(path.join(root, 'support/manager/Scene File Workbench Manager Main.dsa'), 'utf8');
const acorn = new Module('acorn');
acorn._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'], 'acorn');
const tree = acorn.exports.parse(source, {ecmaVersion: 3, allowReserved: false});
acorn.exports.parse(source, {ecmaVersion: 5});
const needed = ['esc', 'plainPanel', 'label', 'button', 'backupDate', 'renderBackups'], functions = {};
function visit(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'FunctionDeclaration' && needed.includes(node.id.name)) {
    assert(!functions[node.id.name], 'Duplicate target function');
    functions[node.id.name] = source.slice(node.start, node.end);
  }
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') visit(value);
  }
}
visit(tree);
needed.forEach(name => assert(functions[name], 'Missing real source function ' + name));
const code = needed.map(name => functions[name]).join('\n');
let passed = 0, failed = 0;
function test(name, fn) {try {fn(); passed++; console.log('PASS', name);} catch (e) {failed++; console.error('FAIL', name, e.stack);}}
function harness(validImages = ['/thumb.png', '/shot.png']) {
  const widgets = [], connections = [], opened = [], loads = [];
  class Widget {
    constructor(parent) {this.parent = parent; this.children = []; if (parent) parent.children.push(this); widgets.push(this);}
    setFixedSize(width, height) {this.width = width; this.height = height;}
    setWidget(widget) {this.content = widget;}
  }
  Widget.AlignLeft = 1; Widget.AlignVCenter = 128;
  class Label extends Widget {} Label.RichText = 1;
  class Button extends Widget {}
  class Layout {
    constructor(parent) {this.parent = parent; this.items = []; parent.layout = this;}
    addWidget(widget, stretch) {this.items.push({widget, stretch});}
    addStretch(stretch) {this.items.push({stretch});}
  }
  class Horizontal extends Layout {}
  class Vertical extends Layout {}
  const context = {
    env: {DzWidget: Widget, DzLabel: Label, DzPushButton: Button, DzHBoxLayout: Horizontal, DzVBoxLayout: Vertical},
    selected: '/scene.duf', busy: false, externalBusy: false, backupLinks: [], backupStatus: {},
    backupArea: new Widget(), trash: new Widget(),
    host: {key: value => String(value).toLowerCase()},
    thumbs: {get(image, size) {loads.push({image, size}); return {pixmap: {image}};}},
    SceneEditorManagerWidgets: {imageButtonPixmap(button, pixmap, width, height) {button.pixmap = pixmap; button.imageSize = [width, height];}},
    screenshotImage: image => validImages.includes(image),
    openScreenshot: image => opened.push(image),
    connect(object, signal, fn, list) {const item = {object, signal, fn}; connections.push(item); list.push(item);},
    disconnect(list) {for (const item of list) {const at = connections.indexOf(item); if (at >= 0) connections.splice(at, 1);} list.length = 0;}
  };
  vm.createContext(context); vm.runInContext(code, context);
  function render(records, guard = () => {}, warnings = []) {context.renderBackups({records, warnings}, guard);}
  return {context, widgets, connections, opened, loads, Label, Button, Horizontal, Vertical, render,
    records() {return context.backupArea.content.layout.items.filter(item => item.widget).map(item => item.widget);},
    labels() {return widgets.filter(w => w instanceof Label);},
    buttons() {return widgets.filter(w => w instanceof Button);}
  };
}
const stamp = new Date(2026, 10, 5, 23, 15, 28).getTime();
test('Date is dd.MM.YYYY and time is hh.mm.ss in local time', () => {
  const h = harness(); assert.equal(h.context.backupDate(stamp), '05.11.2026 23.15.28');
});
test('Date formatter pads day, month and midnight components', () => {
  const h = harness(); assert.equal(h.context.backupDate(new Date(2026, 0, 2, 0, 3, 4).getTime()), '02.01.2026 00.03.04');
});
test('Leap day and year boundary remain calendar-correct', () => {
  const h = harness(); assert.equal(h.context.backupDate(new Date(2028, 1, 29, 23, 59, 59).getTime()), '29.02.2028 23.59.59');
  assert.equal(h.context.backupDate(new Date(2027, 0, 1, 0, 0, 0).getTime()), '01.01.2027 00.00.00');
});
test('Invalid dates never display NaN or Invalid Date', () => {
  const h = harness(); for (const value of [NaN, Infinity, 'not a date', 1e30]) assert.equal(h.context.backupDate(value), '');
});
test('Thumbnail and date are centered together in one horizontal row with unchanged thumbnail size', () => {
  const h = harness(); h.render([{savedAt: stamp, thumbnailPath: '/thumb.png', screenshots: []}]);
  const card = h.records()[0], divider = card.layout.items[0].widget, heading = card.layout.items[1].widget;
  assert.equal(divider.text, '<hr/>'); assert(heading.layout instanceof h.Horizontal);
  const items = heading.layout.items;
  assert.equal(items.length, 4); assert.deepEqual(items[0], {stretch: 1}); assert.deepEqual(items[3], {stretch: 1});
  const [thumbnail, date] = items.filter(i => i.widget).map(i => i.widget);
  assert.equal(thumbnail.parent, heading); assert.equal(date.parent, heading);
  assert.deepEqual([thumbnail.width, thumbnail.height], [91, 91]);
  assert.equal(thumbnail.pixmap.image, '/thumb.png'); assert.equal(items[2].stretch, 0);
  assert.equal(card.layout.items.filter(i => i.widget).length, 2);
});
test('Date remains gold; time is smaller on the same nonwrapping line', () => {
  const h = harness(); h.render([{savedAt: stamp, thumbnailPath: '/thumb.png'}]);
  const date = h.labels().find(w => w.text.includes('05.11.2026'));
  assert(date.text.includes("color='#e7cf88'")); assert(date.text.includes('05.11.2026 <small>23.15.28</small>'));
  assert(!/<br|align='center'/.test(date.text)); assert.equal(date.wordWrap, false);
  assert.equal(date.textFormat, h.Label.RichText); assert.equal(date.alignment, 129);
});
test('Missing thumbnail still centers the compact date row', () => {
  const h = harness(); h.render([{savedAt: stamp, thumbnailPath: '/missing.png'}]);
  const heading = h.records()[0].layout.items[1].widget;
  const items = heading.layout.items;
  assert.equal(items.length, 3); assert.deepEqual(items[0], {stretch: 1}); assert.deepEqual(items[2], {stretch: 1});
  assert.equal(items[1].stretch, 0); assert(items[1].widget.text.includes('05.11.2026'));
  assert.equal(h.loads.length, 0);
});
test('Missing/invalid date uses escaped status and never invents a time', () => {
  const h = harness(); h.render([{status: '<unknown & unrecorded>'}, {savedAt: 'broken', status: 'Invalid <date>'}]);
  const dates = h.labels().filter(w => w.text.startsWith('<h2'));
  assert(dates[0].text.includes('&lt;unknown &amp; unrecorded&gt;'));
  assert(dates[1].text.includes('Invalid &lt;date&gt;')); assert(dates.every(w => !w.text.includes('<small>')));
});
test('Full screenshots stay separate, deduplicated and clickable below the heading', () => {
  const h = harness(); h.render([{savedAt: stamp, thumbnailPath: '/thumb.png', screenshots: [{path:'/shot.png'}, {path:'/shot.png'}, {path:'/missing.png'}]}]);
  const card = h.records()[0], heading = card.layout.items[1].widget, gallery = card.layout.items[2].widget;
  assert.notEqual(heading, gallery); assert(gallery.layout instanceof h.Vertical);
  assert.equal(h.buttons().length, 1);
  const shot = h.buttons()[0]; assert.equal(shot.parent, gallery); assert.equal(shot.pixmap.image, '/shot.png');
  assert.deepEqual([shot.width, shot.height], [150, 150]); assert.deepEqual(shot.imageSize, [136, 136]);
  assert.equal(shot.toolTip, '/shot.png'); h.connections[0].fn(); assert.deepEqual(h.opened, ['/shot.png']);
});
test('Screenshot click remains disabled during work or after source selection changes', () => {
  const h = harness(); h.render([{screenshots: [{path: '/shot.png'}]}]); const click = h.connections[0].fn;
  h.context.busy = true; click(); h.context.busy = false; h.context.externalBusy = true; click();
  h.context.externalBusy = false; h.context.selected = '/other.duf'; click(); assert.equal(h.opened.length, 0);
});
test('Cancellation preserves published cards and disconnects unpublished screenshot handlers', () => {
  const h = harness(); h.render([{screenshots: [{path: '/shot.png'}]}]); const previous = h.context.backupArea.content, link = h.connections[0];
  assert.throws(() => h.render([{screenshots: [{path: '/shot.png'}]}], phase => {if (phase === 'Publish current scene backups') throw Error('Cancelled');}), /Cancelled/);
  assert.strictEqual(h.context.backupArea.content, previous); assert.deepEqual(h.connections, [link]);
});
test('Successful refresh disconnects old screenshot handlers and keeps warning count', () => {
  const h = harness(); h.render([{screenshots: [{path: '/shot.png'}]}]); const old = h.connections[0];
  h.render([{savedAt: stamp, screenshots: [{path: '/shot.png'}]}], () => {}, ['warn']);
  assert.equal(h.connections.length, 1); assert.notEqual(h.connections[0], old);
  assert.equal(h.context.backupStatus.text, '1 backups of the selected source scene; 1 metadata warnings');
});
test('Empty backups list preserves the existing empty-state status', () => {
  const h = harness(); h.render([]); assert.equal(h.records().length, 0);
  assert.equal(h.context.backupStatus.text, 'No backups match this scene source path.');
});
test('Manager source passes ES3 and ES5 parsers', () => {
  acorn.exports.parse(source, {ecmaVersion: 3, allowReserved: false}); acorn.exports.parse(source, {ecmaVersion: 5});
});
if (process.argv.includes('--bundle-check')) test('Built standalone script contains exact current manager source', () => {
  const bundle = fs.readFileSync(path.join(root, 'Scene File Workbench.dsa'), 'utf8');
  assert.equal(bundle.split(source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')).length, 2);
});
console.log(JSON.stringify({status: failed ? 'failed' : 'passed', tests: passed + failed, passed, failed, nativeDAZExecuted: false, realScenesModified: false}));
if (failed) process.exitCode = 1;

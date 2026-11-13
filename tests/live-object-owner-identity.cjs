// Minimal real metadata from hunter_call5_13.duf and Skyrim05.duf. No scene writes/native loads.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const saved=[
  {
    "id": "Genesis8_1Female",
    "name": "Genesis8_1Female",
    "label": "Lisa 8.1",
    "url": "/data/DAZ%203D/Genesis%208/Female%208_1/Genesis8_1Female.dsf#Genesis8_1Female",
    "preview": {
      "type": "figure"
    }
  },
  {
    "id": "Female 8_1 Tear",
    "name": "Female 8_1 Tear",
    "label": "Genesis 8.1 Female Tear",
    "url": "/data/DAZ%203D/Genesis%208/Female%208_1%20Tear/Female%208_1%20Tear.dsf#Female%208_1%20Tear",
    "parent": "#Genesis8_1Female",
    "preview": {
      "type": "figure"
    }
  },
  {
    "id": "LI_G3F_Pubic_Hair_200000",
    "name": "LI_G3F_Pubic_Hair_200000",
    "label": "LI_G8F_Pubic_Hair_01",
    "url": "/data/Laticis%20Imagery/Pubic%20Hair/LI_G8F_Pubic_Hair_01/LI_G3F_Pubic_Hair_200000.dsf#LI_G3F_Pubic_Hair_200000",
    "parent": "#Genesis8_1Female",
    "preview": {
      "type": "figure"
    }
  },
  {
    "id": "CJ_FiberLashes_37800",
    "name": "CJ_FiberLashes_37800",
    "label": "CJ_FiberLashes",
    "url": "/data/Colm%20Jackson/Fiberlash/Fiberlashes/CJ_FiberLashes_37800.dsf#CJ_FiberLashes_37800",
    "parent": "#Genesis8_1Female",
    "preview": {
      "type": "figure"
    }
  }
];
const runtime=[
  {
    "id": "Genesis8_1Female",
    "name": "Genesis8_1Female",
    "label": "Amy 8.1",
    "url": "/data/DAZ%203D/Genesis%208/Female%208_1/Genesis8_1Female.dsf#Genesis8_1Female",
    "preview": {
      "type": "figure"
    }
  },
  {
    "id": "Female 8_1 Tear",
    "name": "Female 8_1 Tear",
    "label": "Genesis 8.1 Female Tear",
    "url": "/data/DAZ%203D/Genesis%208/Female%208_1%20Tear/Female%208_1%20Tear.dsf#Female%208_1%20Tear",
    "parent": "#Genesis8_1Female",
    "preview": {
      "type": "figure"
    }
  },
  {
    "id": "LI_G3F_Pubic_Hair_200000",
    "name": "LI_G3F_Pubic_Hair_200000",
    "label": "LI_G8F_Pubic_Hair_01",
    "url": "/data/Laticis%20Imagery/Pubic%20Hair/LI_G8F_Pubic_Hair_01/LI_G3F_Pubic_Hair_200000.dsf#LI_G3F_Pubic_Hair_200000",
    "parent": "#Genesis8_1Female",
    "preview": {
      "type": "figure"
    }
  },
  {
    "id": "CJ_FiberLashes_37800",
    "name": "CJ_FiberLashes_37800",
    "label": "CJ_FiberLashes",
    "url": "/data/Colm%20Jackson/Fiberlash/Fiberlashes/CJ_FiberLashes_37800.dsf#CJ_FiberLashes_37800",
    "parent": "#Genesis8_1Female",
    "preview": {
      "type": "figure"
    }
  },
  {
    "id": "Genesis8_1Female-1",
    "name": "Genesis8_1Female",
    "label": "Lisa 8.1",
    "url": "/data/DAZ%203D/Genesis%208/Female%208_1/Genesis8_1Female.dsf#Genesis8_1Female",
    "preview": {
      "type": "figure"
    }
  },
  {
    "id": "Female 8_1 Tear-1",
    "name": "Female 8_1 Tear",
    "label": "Genesis 8.1 Female Tear (2)",
    "url": "/data/DAZ%203D/Genesis%208/Female%208_1%20Tear/Female%208_1%20Tear.dsf#Female%208_1%20Tear",
    "parent": "#Genesis8_1Female-1",
    "preview": {
      "type": "figure"
    }
  },
  {
    "id": "LI_G3F_Pubic_Hair_200000-1",
    "name": "LI_G3F_Pubic_Hair_200000",
    "label": "LI_G8F_Pubic_Hair_01 (2)",
    "url": "/data/Laticis%20Imagery/Pubic%20Hair/LI_G8F_Pubic_Hair_01/LI_G3F_Pubic_Hair_200000.dsf#LI_G3F_Pubic_Hair_200000",
    "parent": "#Genesis8_1Female-1",
    "preview": {
      "type": "figure"
    }
  },
  {
    "id": "CJ_FiberLashes_37800-1",
    "name": "CJ_FiberLashes_37800",
    "label": "CJ_FiberLashes (2)",
    "url": "/data/Colm%20Jackson/Fiberlash/Fiberlashes/CJ_FiberLashes_37800.dsf#CJ_FiberLashes_37800",
    "parent": "#Genesis8_1Female-1",
    "preview": {
      "type": "figure"
    }
  }
];

function capture(source,nativeRecords,file){const c={};vm.createContext(c);for(const f of ['Scene File Workbench Parameter Compare.dsa',file||'Scene File Workbench Live Compare.dsa'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../support/manager',f),'utf8'),c);const hs=nativeRecords.map(n=>({assetId:decodeURIComponent(n.url.split('#')[1]),assetSource:decodeURIComponent(n.url),getName:()=>n.name,getLabel:()=>n.label,getNodeParent:()=>hs[nativeRecords.findIndex(p=>n.parent==='#'+p.id)]||null,inherits:t=>t==='DzFigure',getNumProperties:()=>0}));const doc={scene:{nodes:source}},io={read:()=>doc,resolve:p=>p,stamp:()=>1};return c.SceneEditorLiveCompare.create({Scene:{getNumNodes:()=>hs.length,getNode:i=>hs[i]},pointersAreEqual:(a,b)=>a===b},'saved.duf',io,()=>{},doc);}
const cap=capture(saved,runtime);assert.equal(cap.unresolvedSavedIds.length,0);assert.equal(cap.unresolvedLiveIds.length,0);
for(const n of saved.filter(n=>n.parent)){const found=cap.snapshot.document.scene.nodes.find(x=>x.id===n.id);assert(found,n.label);assert.equal(found.label,n.label+' (2)');assert.equal(found.parent,'#Genesis8_1Female');}
// Two identical copies under the same owner cannot be resolved from an instance suffix.
const clone=JSON.parse(JSON.stringify(runtime));const second=Object.assign({},clone.find(n=>n.label==='CJ_FiberLashes (2)'),{id:'another-lash',label:'CJ_FiberLashes (3)'});clone.push(second);assert(capture(saved,clone).unresolvedSavedIds.includes('CJ_FiberLashes_37800'));
// Two saved siblings cannot be collapsed onto one native candidate.
const dupSaved=JSON.parse(JSON.stringify(saved));dupSaved.push(Object.assign({},saved.find(n=>n.label==='CJ_FiberLashes'),{id:'another-saved-lash',label:'CJ_FiberLashes other'}));assert(capture(dupSaved,runtime).unresolvedSavedIds.includes('CJ_FiberLashes_37800'));
// Parent identity is necessary: the similarly named child on Amy must not satisfy Lisa.
const wrongOwner=JSON.parse(JSON.stringify(runtime));for(const n of wrongOwner)if(n.label.endsWith('(2)'))n.parent='#Genesis8_1Female';assert(capture(saved,wrongOwner).unresolvedSavedIds.includes('CJ_FiberLashes_37800'));
// Exercise the old implementation against exactly the same real metadata.
if(process.argv.includes('--baseline')){const oldPath='../Diagnostics/rollback-live-owner-20261113/Live Compare.before.dsa';let src=fs.readFileSync(path.join(__dirname,oldPath),'utf8');const baseline=path.join(__dirname,'../support/manager/Scene File Workbench Live Compare.dsa');const originalRead=fs.readFileSync;fs.readFileSync=function(p,...args){return p===baseline?src:originalRead.call(this,p,...args);};try{const before=capture(saved,runtime);assert.equal(before.unresolvedSavedIds.length,3);console.log('Real metadata baseline:3 unresolved; fixed:0; no native scene mutation');}finally{fs.readFileSync=originalRead;}}
console.log('PASS real three-object owner matching and duplicate/wrong-owner rejection');

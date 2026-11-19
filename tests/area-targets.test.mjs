import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotAreaTargets} from '../src/core/area-targets.mjs';
import {snapshotPolygonAreaTargets,snapshotSquareAreaTargets} from '../src/area-rules.mjs';

test('area selection captures eligible token footprints once and preserves distinct tokens',()=>{
  const large={tokenUuid:'Scene.s.Token.large',actorUuid:'Actor.a',sceneId:'s',eligible:true,cells:['0,1','1,1','1,2']};
  const linked={...large,tokenUuid:'Scene.s.Token.linked',cells:['1,2']};
  const result=snapshotAreaTargets({sceneId:'s',affectedCells:['1,1','1,2','1,2'],tokens:[
    large,large,linked,
    {...large,tokenUuid:'blocked',eligible:false},
    {...large,tokenUuid:'other-scene',sceneId:'other'},
    {...large,tokenUuid:'outside',cells:['0,0']}
  ]});
  large.cells.length=0;
  assert.deepEqual(result,{sceneId:'s',cells:['1,1','1,2'],targets:[
    {tokenUuid:large.tokenUuid,actorUuid:large.actorUuid,cells:['1,1','1,2']},
    {tokenUuid:linked.tokenUuid,actorUuid:linked.actorUuid,cells:['1,2']}
  ]});
});

test('an inconsistent token-to-actor mapping cannot be captured',()=>{
  const token={tokenUuid:'token',actorUuid:'Actor.a',sceneId:'s',eligible:true,cells:['1']};
  assert.throws(()=>snapshotAreaTargets({sceneId:'s',affectedCells:['1'],tokens:[token,{...token,actorUuid:'Actor.b'}]}),/identidade/);
});

test('square areas include exactly half a cell and exclude a smaller overlap',()=>{
  const cellCoverage=[{cell:'edge',fraction:0.499},{cell:'half',fraction:0.5},{cell:'inside',fraction:1}];
  const tokens=cellCoverage.map(({cell})=>({tokenUuid:cell,actorUuid:'Actor.'+cell,sceneId:'s',eligible:true,cells:[cell]}));
  const result=snapshotSquareAreaTargets({sceneId:'s',cellCoverage,tokens});
  assert.deepEqual(result.cells,['half','inside']);
  assert.deepEqual(result.targets.map(t=>t.tokenUuid),['half','inside']);
  assert.throws(()=>snapshotSquareAreaTargets({sceneId:'s',cellCoverage:[{cell:'invalid',fraction:1.5}],tokens}),/cobertura/);
});


test('polygon selection includes an exact half square and excludes a neighboring sliver',()=>{
 const polygon=[{x:50,y:100},{x:175,y:100},{x:175,y:200},{x:50,y:200}];
 const squares=[{cell:'a',x:0,y:100},{cell:'b',x:100,y:100},{cell:'edge',x:100,y:200},{cell:'sliver',x:150,y:100}];
 const tokens=[{tokenUuid:'Token.1',actorUuid:'Actor.1',sceneId:'scene',eligible:true,cells:['a','b']}];
 const result=snapshotPolygonAreaTargets({sceneId:'scene',polygon,squares,size:100,tokens});
 assert.deepEqual(result.cells,['a','b']);
 assert.deepEqual(result.targets,[{tokenUuid:'Token.1',actorUuid:'Actor.1',cells:['a','b']}]);
});

test('polygon selection clips diagonal boundaries regardless of contour direction',()=>{
 const polygon=[{x:0,y:0},{x:100,y:0},{x:0,y:100}];
 const input={sceneId:'scene',squares:[{cell:'a',x:0,y:0}],size:100,tokens:[]};
 assert.deepEqual(snapshotPolygonAreaTargets({...input,polygon:[...polygon].reverse()}).cells,['a']);
 assert.deepEqual(snapshotPolygonAreaTargets({...input,polygon:[...polygon.slice(0,2),{x:0,y:99}]}).cells,[]);
 assert.throws(()=>snapshotPolygonAreaTargets({...input,size:0,polygon}));
});

test('scene preview uses visible single-contour regions and square token footprints',async()=>{
 const {sceneAreaOptions,previewSceneArea}=await import('../src/scene-area.mjs');
 const document={id:'r',isSingleShape:true,polygons:[{points:[50,0,100,0,100,100,50,100]}],elevation:{bottom:0,top:0}};
 const makeToken=(name,x,width,visible=true,elevation=0)=>({name,isVisible:visible,actor:{uuid:'Actor.shared'},document:{uuid:'Token.'+name,elevation},bounds:{x,y:0,width,height:100}});
 const wide=makeToken('Wide',0,200),other=makeToken('Other',0,100),hidden=makeToken('Hidden',0,100,false),raised=makeToken('Raised',0,100,true,3),edge=makeToken('Edge',100,100);
 const grid={isSquare:true,size:100,getOffsetRange:({x,width})=>[0,x/100,1,(x+width)/100],getTopLeftPoint:({i,j})=>({x:j*100,y:i*100})};
 const canvas={ready:true,scene:{id:'scene'},grid,regions:{placeables:[{isVisible:true,document},{isVisible:false,document:{...document,id:'secret'}},{isVisible:true,document:{...document,id:'hole',isSingleShape:false}}]},tokens:{placeables:[wide,other,hidden,raised,edge]}};
 assert.deepEqual(sceneAreaOptions(canvas).map(r=>r.document.id),['r']);
 assert.deepEqual(previewSceneArea('r',canvas).map(t=>[t.tokenUuid,t.cells]),[['Token.Wide',['0,0']],['Token.Other',['0,0']]]);
 assert.equal(previewSceneArea('secret',canvas),null);
 assert.equal(previewSceneArea('r',{...canvas,grid:{isSquare:false}}),null);
});

test('the GM includes hidden occupants at half-cell coverage while the player preview keeps them concealed',async()=>{
 const {previewSceneArea,sceneAreaTargets}=await import('../src/scene-area.mjs');
 const region={id:'r',isSingleShape:true,polygons:[{points:[50,0,100,0,100,100,50,100]}]};
 const grid={isSquare:true,size:100,getOffsetRange:()=>[0,0,1,1],getTopLeftPoint:()=>({x:0,y:0})};
 const token={uuid:'Token.hidden',actor:{uuid:'Actor.hidden'},name:'Oculto',hidden:true,x:0,y:0,elevation:0,getSize:()=>({width:100,height:100})};
 const scene={id:'s',grid,tokens:[token],regions:{get:()=>region}};
 assert.deepEqual(sceneAreaTargets(scene,'r').map(t=>[t.actorUuid,t.hidden,t.areaFraction]),[['Actor.hidden',true,1]]);
 assert.deepEqual(previewSceneArea('r',{ready:true,scene,grid,regions:{placeables:[{document:region,isVisible:true}]},tokens:{placeables:[{document:token,actor:token.actor,isVisible:false}]}}),[]);
});

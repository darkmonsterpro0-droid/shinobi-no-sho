import {snapshotPolygonAreaTargets} from './area-rules.mjs';
import {joinedBody} from './body-state.mjs';

export function sceneAreaOptions(sceneCanvas=globalThis.canvas) {
  if(!sceneCanvas?.ready||!sceneCanvas.grid?.isSquare)return [];
  return (sceneCanvas.regions?.placeables??[]).filter(region=>
    region.isVisible&&region.document?.isSingleShape&&region.document.polygons.length===1);
}

export function previewSceneArea(regionId,sceneCanvas=globalThis.canvas) {
  const region=sceneAreaOptions(sceneCanvas).find(entry=>entry.document.id===regionId);
  if(!region)return null;
  const {grid,scene}=sceneCanvas;
  return areaTargets(scene.id,grid,region.document,(sceneCanvas.tokens?.placeables??[])
   .filter(token=>token.isVisible&&!joinedBody(token.actor)).map(token=>({document:token.document,actor:token.actor,bounds:token.bounds,name:token.name})));
}

// Recalculate on the GM using Scene documents, including when the GM views another scene.
export function sceneAreaTargets(scene,regionId){
  const region=scene?.regions?.get(regionId),grid=scene?.grid;
  if(!grid?.isSquare||!region?.isSingleShape||region.polygons.length!==1)return null;
  const tokens=[...scene.tokens].filter(token=>token.actor&&!joinedBody(token.actor)).map(document=>({
   document,actor:document.actor,bounds:{x:document.x,y:document.y,...document.getSize()},name:document.name
  }));
  return areaTargets(scene.id,grid,region,tokens);
}

function areaTargets(sceneId,grid,region,tokens){
  const {polygons,elevation}=region;
  const points=polygons[0].points;
  const polygon=[];
  for(let i=0;i<points.length;i+=2)polygon.push({x:points[i],y:points[i+1]});

  const squares=new Map(),entries=[],names=new Map();
  for(const token of tokens) {
    if(!token.actor?.uuid)continue;
    const height=token.document.elevation;
    if((elevation?.bottom!=null&&!(height>=elevation.bottom))||
       (elevation?.top!=null&&!(height<=elevation.top)))continue;

    const [i0,j0,i1,j1]=grid.getOffsetRange(token.bounds);
    const cells=[];
    for(let i=i0;i<i1;i++) {
      for(let j=j0;j<j1;j++) {
        const cell=`${i},${j}`;
        cells.push(cell);
        if(!squares.has(cell))squares.set(cell,{cell,...grid.getTopLeftPoint({i,j})});
      }
    }
    const tokenUuid=token.document.uuid;
    entries.push({tokenUuid,actorUuid:token.actor.uuid,sceneId,eligible:true,cells});
    names.set(tokenUuid,token.name);
  }
  const snapshot=snapshotPolygonAreaTargets({sceneId,polygon,squares:[...squares.values()],size:grid.size,tokens:entries});
  const occupied=new Map(entries.map(entry=>[entry.tokenUuid,entry.cells.length]));
  return snapshot.targets.map(target=>({...target,name:names.get(target.tokenUuid),
   areaFraction:target.cells.length/occupied.get(target.tokenUuid),
   hidden:!!tokens.find(token=>token.document.uuid===target.tokenUuid)?.document.hidden}));
}

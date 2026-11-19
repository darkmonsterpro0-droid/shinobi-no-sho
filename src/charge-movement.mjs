// Básico 4.1.b pp. 38, 264: straight run, at least 3 m, then one corporal attack.
import {joinedBody} from './body-state.mjs';
// Ooiga Gatenga's book specifies width, but not the line length. The table draws
// its rectangle; validate that chosen geometry instead of inventing a length.
export function lineChargeGeometry(origin,points,{pixelsPerMetre,width=5,maximum,measure=null}){
 const polygon=points.map(p=>({...p}));
 if(polygon.length===5&&polygon[0].x===polygon[4].x&&polygon[0].y===polygon[4].y)polygon.pop();
 if(polygon.length!==4||!Number.isFinite(pixelsPerMetre)||pixelsPerMetre<=0||
  ![origin.x,origin.y,...polygon.flatMap(p=>[p.x,p.y])].every(Number.isFinite))throw Error('Use uma região retangular para a linha de 5 m.');
 const edges=polygon.map((p,i)=>({x:polygon[(i+1)%4].x-p.x,y:polygon[(i+1)%4].y-p.y}));
 const lengths=edges.map(v=>Math.hypot(v.x,v.y)),epsilon=1e-4;
 if(lengths.some(n=>n<=0)||edges.some((v,i)=>Math.abs(v.x*edges[(i+1)%4].x+v.y*edges[(i+1)%4].y)>epsilon*lengths[i]*lengths[(i+1)%4]))throw Error('A linha precisa ser um retângulo, sem curvas ou recortes.');
 const candidates=[];
 for(let i=0;i<4;i++){
  if(Math.abs(lengths[i]/pixelsPerMetre-width)>epsilon)continue;
  const start={x:(polygon[i].x+polygon[(i+1)%4].x)/2,y:(polygon[i].y+polygon[(i+1)%4].y)/2};
  const end={x:(polygon[(i+2)%4].x+polygon[(i+3)%4].x)/2,y:(polygon[(i+2)%4].y+polygon[(i+3)%4].y)/2};
  const dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy),ox=origin.x-start.x,oy=origin.y-start.y;
  if(Math.abs(ox*dy-oy*dx)/length>epsilon*pixelsPerMetre||(ox*dx+oy*dy)/length>epsilon*pixelsPerMetre)continue;
  const travel=measure?measure(origin,end):Math.hypot(end.x-origin.x,end.y-origin.y)/pixelsPerMetre;
  if(!Number.isFinite(travel)||travel<3)throw Error('Investida exige pelo menos 3 m de avanço em linha reta.');
  if(travel>maximum)throw Error('A trajetória está além da corrida da Investida.');
  candidates.push({origin:{...origin},endpoint:end,travel,width,polygon});
 }
 if(candidates.length!==1)throw Error('Desenhe uma linha de 5 m de largura, alinhada à frente do Inuzuka.');
 return candidates[0];
}
export function prepareLineCharge(actor,regionId,{maximum}){
 const c=globalThis.canvas,scene=c?.scene,region=scene?.regions?.get(regionId);
 if(!c?.ready||!c.grid?.isSquare||!region?.isSingleShape||region.polygons.length!==1)throw Error('Selecione uma região retangular na cena para a linha de 5 m.');
 const sources=(c.tokens?.placeables??[]).filter(t=>t.actor?.uuid===actor.uuid),controlled=sources.filter(t=>t.controlled);
 const source=controlled.length===1?controlled[0]:sources.length===1?sources[0]:null;
 if(!source?.document.isOwner)throw Error('Controle um único token do Inuzuka para definir a trajetória.');
 const points=region.polygons[0].points,polygon=[];for(let i=0;i<points.length;i+=2)polygon.push({x:points[i],y:points[i+1]});
 const path=lineChargeGeometry(source.document.getCenterPoint(),polygon,{maximum,pixelsPerMetre:scene.grid.size/scene.grid.distance,
  measure:(a,b)=>c.grid.measurePath([a,b]).distance});
 if(source.checkCollision(path.endpoint,{origin:path.origin,mode:'any',type:'move'}))throw Error('Uma parede ou superfície bloqueia a Investida.');
 return {...path,sceneId:scene.id,regionId,sourceTokenId:source.document.id};
}
export function chargeEndpoint(origin,target,{reach,maximum,pixelsPerMetre,cellDistance=1,
 sourceWidth=1,sourceHeight=1,targetWidth=1,targetHeight=1,measure=null}){
 if(![origin.x,origin.y,target.x,target.y,reach,maximum,pixelsPerMetre].every(Number.isFinite)||reach<=0||maximum<3||pixelsPerMetre<=0)
  throw Error('Não foi possível medir a Investida nesta cena.');
 const dx=target.x-origin.x,dy=target.y-origin.y,length=Math.hypot(dx,dy);
 if(!length)throw Error('Investida exige um alvo em outra posição.');
 if(![cellDistance,sourceWidth,sourceHeight,targetWidth,targetHeight].every(v=>Number.isFinite(v)&&v>0))
  throw Error('Confira as dimensões dos tokens para a Investida.');
 // Reach is measured between the nearest occupied cells, not token centres.
 // The configured token footprint is authoritative; never infer it from height.
 const halfWidth=((sourceWidth+targetWidth)/2*cellDistance+Math.max(0,reach-cellDistance))*pixelsPerMetre;
 const halfHeight=((sourceHeight+targetHeight)/2*cellDistance+Math.max(0,reach-cellDistance))*pixelsPerMetre;
 const factor=Math.max(0,dx?1-halfWidth/Math.abs(dx):0,dy?1-halfHeight/Math.abs(dy):0);
 const endpoint={x:origin.x+dx*factor,y:origin.y+dy*factor};
 const travel=measure?measure(origin,endpoint):length*factor/pixelsPerMetre;
 if(!Number.isFinite(travel))throw Error('Não foi possível medir a corrida nesta grade.');
 if(travel<3)throw Error('Investida exige pelo menos 3 m de avanço antes do ataque.');
 if(travel>maximum)throw Error('O alvo está além da corrida da Investida.');
 return {...endpoint,travel};
}
// Swept axis-aligned token footprint. Merely touching an adjacent cell edge is
// not an overlap; another occupied interior requires the table to clear a path.
export function chargeObstructed(origin,end,{width,height},obstacles=[]){
 return obstacles.some(rect=>{
  const bounds={left:rect.x-width/2,right:rect.x+rect.width+width/2,
   top:rect.y-height/2,bottom:rect.y+rect.height+height/2};
  let enter=0,leave=1;
  for(const [axis,low,high]of [['x',bounds.left,bounds.right],['y',bounds.top,bounds.bottom]]){
   const start=origin[axis],delta=end[axis]-start,epsilon=1e-6;
   if(Math.abs(delta)<epsilon){if(start<=low+epsilon||start>=high-epsilon)return false;continue;}
   const a=(low+epsilon-start)/delta,b=(high-epsilon-start)/delta;
   enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));
   if(enter>=leave)return false;
  }
  return enter<leave;
 });
}
export async function moveCharge(actor,targetUuid,{reach,maximum,preview=false,snapshot=null}){
 const scene=globalThis.canvas?.scene;
 if(!scene||!canvas.grid?.isSquare)throw Error('A Investida automática requer uma cena com grade quadrada.');
 const sources=(canvas.tokens?.placeables??[]).filter(token=>token.actor?.uuid===actor.uuid);
 const controlled=sources.filter(token=>token.controlled);
 const source=controlled.length===1?controlled[0]:sources.length===1?sources[0]:null;
 const targets=(canvas.tokens?.placeables??[]).filter(token=>token.actor?.uuid===targetUuid);
 if(!source||targets.length!==1)throw Error('Controle o atacante e marque um alvo inequívoco para a Investida.');
 const target=targets[0];
 if(!source.document.isOwner||target.document.hidden)throw Error('A Investida exige controle do atacante e alvo visível.');
 if(source.document.elevation!==target.document.elevation)throw Error('A Investida entre elevações diferentes precisa de uma trajetória definida pela mesa.');
 if(snapshot){
  const current=source.document;
  if(current.x===snapshot.destination.x&&current.y===snapshot.destination.y)return {...snapshot,duplicate:true};
  if(current.x!==snapshot.start.x||current.y!==snapshot.start.y||target.document.x!==snapshot.target.x||target.document.y!==snapshot.target.y)
   throw Error('Os participantes se moveram. Prepare uma nova Investida a partir da posição atual.');
 }
 const origin=source.document.getCenterPoint(),destination=target.document.getCenterPoint();
 const size=scene.grid.size,dimension=(token,key)=>Number(token.document[key]??1);
 const endpoint=chargeEndpoint(origin,destination,{reach,maximum,pixelsPerMetre:size/scene.grid.distance,
  cellDistance:scene.grid.distance,sourceWidth:dimension(source,'width'),sourceHeight:dimension(source,'height'),
  targetWidth:dimension(target,'width'),targetHeight:dimension(target,'height'),
  measure:canvas.grid.measurePath?(a,b)=>canvas.grid.measurePath([a,b]).distance:null});
 if(source.checkCollision(endpoint,{origin,mode:'any',type:'move'}))throw Error('Uma parede ou superfície bloqueia a Investida.');
 const obstacles=(canvas.tokens?.placeables??[]).filter(token=>token!==source&&token!==target&&!joinedBody(token.actor)&&
  token.document.elevation===source.document.elevation).map(token=>({x:token.document.x,y:token.document.y,
   width:dimension(token,'width')*size,height:dimension(token,'height')*size}));
 if(chargeObstructed(origin,endpoint,{width:dimension(source,'width')*size,height:dimension(source,'height')*size},obstacles))
  throw Error('Outra criatura ocupa o trajeto ou a chegada. Defina um caminho livre com a mesa antes da Investida.');
 const x=source.document.x+endpoint.x-origin.x,y=source.document.y+endpoint.y-origin.y;
 const prepared={origin,start:{x:source.document.x,y:source.document.y},target:{x:target.document.x,y:target.document.y},destination:{x,y},travel:endpoint.travel};
 if(preview)return prepared;
 const moved=await source.document.move({x,y});
 if(moved===false)throw Error('O Foundry não permitiu o deslocamento da Investida.');
 return prepared;
}

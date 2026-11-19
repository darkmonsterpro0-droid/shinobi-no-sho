import {measureTokenDistance} from './token-distance.mjs';
export const tokenPosition=token=>{
 const data=token.toObject?.()??token;return {x:data.x,y:data.y,elevation:data.elevation};
};
// Validates a straight native movement; movement allowances belong to adapters.
export function validateTokenDestination(scene,origin,token,destination,range){
 if(!origin||!token||!destination||!['x','y','elevation'].every(k=>Number.isFinite(destination[k]))||destination.elevation!==token.elevation)
  throw Error('Escolha uma célula na mesma elevação da criatura.');
 const size=token.getSize(),bounds={...destination,...size},rect=scene.dimensions?.sceneRect;
 if(rect&&(!rect.contains(bounds.x,bounds.y)||!rect.contains(bounds.x+size.width-1e-6,bounds.y+size.height-1e-6)))
  throw Error('O destino precisa estar dentro da cena.');
 const end={...destination,width:token.width,height:token.height,getCenterPoint:()=>token.getCenterPoint(destination)};
 const savedOrigin=tokenPosition(origin),from={...savedOrigin,width:origin.width,height:origin.height,getCenterPoint:()=>origin.getCenterPoint(savedOrigin)};
 let gap=measureTokenDistance(from,end,scene.grid);
 if(gap==null&&savedOrigin.elevation===end.elevation)gap=scene.grid?.measurePath?.([from.getCenterPoint(),end.getCenterPoint()])?.distance;
 if(!Number.isFinite(gap)||!Number.isFinite(range)||gap>range)throw Error('O destino precisa estar dentro do alcance permitido.');
 if(!token.object?.checkCollision||token.object.checkCollision(token.getCenterPoint(destination),{origin:token.getCenterPoint(),type:'move',mode:'any'}))
  throw Error('Uma parede impede o movimento até esse ponto.');
 if([...(scene.tokens?.contents??scene.tokens??[])].some(other=>{
  if(other.uuid===token.uuid||!other.actor)return false;
  const position=tokenPosition(other),size=other.getSize();
  return position.elevation===token.elevation&&position.x<bounds.x+bounds.width-1e-6&&position.x+size.width>bounds.x+1e-6&&
   position.y<bounds.y+bounds.height-1e-6&&position.y+size.height>bounds.y+1e-6;
 }))throw Error('Escolha um destino sem outra criatura.');
}

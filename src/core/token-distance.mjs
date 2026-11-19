// Distance between occupied grid cells, using the scene's own metric. Token
// dimensions are configured by the table; this does not infer them from size.
export function measureTokenDistance(source,target,grid){
 if(!grid?.isSquare||!grid.measurePath||!grid.getOffsetRange||!grid.getCenterPoint||
  source.elevation!==target.elevation)return null;
 const cells=token=>{
  const bounds={x:Number(token.x),y:Number(token.y),width:Number(token.width)*grid.size,height:Number(token.height)*grid.size};
  if(!Object.values(bounds).every(Number.isFinite)||bounds.width<=0||bounds.height<=0)return null;
  const [i0,j0,i1,j1]=grid.getOffsetRange(bounds);
  if(![i0,j0,i1,j1].every(Number.isInteger)||i1<=i0||j1<=j0||(i1-i0)*(j1-j0)>256)return null;
  const points=[];for(let i=i0;i<i1;i++)for(let j=j0;j<j1;j++)points.push(grid.getCenterPoint({i,j}));
  return points;
 };
 const a=cells(source),b=cells(target);if(!a||!b)return null;
 let nearest=Infinity;
 for(const origin of a)for(const end of b){
  const distance=grid.measurePath([origin,end]).distance;
  if(!Number.isFinite(distance)||distance<0)return null;
  nearest=Math.min(nearest,distance);if(nearest===0)return 0;
 }
 return nearest;
}

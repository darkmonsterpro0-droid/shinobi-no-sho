import {snapshotAreaTargets} from './core/area-targets.mjs';

// Regra da mesa para quadrados, conforme a abertura do GAS 10 Anos, pp. 98–99.
export function snapshotSquareAreaTargets({sceneId,cellCoverage,tokens}) {
  const affectedCells=[];
  for(const {cell,fraction} of cellCoverage) {
    if(!Number.isFinite(fraction)||fraction<0||fraction>1)throw Error('A cobertura do quadrado deve estar entre 0 e 1.');
    if(fraction>=0.5)affectedCells.push(cell);
  }
  return snapshotAreaTargets({sceneId,affectedCells,tokens});
}


// Intersect a simple polygon with a unit square in local coordinates.
function clipEdge(points,axis,boundary,direction) {
  const clipped=[];
  const other=1-axis;
  let previous=points.at(-1);
  for(const point of points) {
    const inside=(point[axis]-boundary)*direction>=0;
    const previousInside=(previous[axis]-boundary)*direction>=0;
    if(inside!==previousInside) {
      const t=(boundary-previous[axis])/(point[axis]-previous[axis]);
      const intersection=[];
      intersection[axis]=boundary;
      intersection[other]=previous[other]+t*(point[other]-previous[other]);
      clipped.push(intersection);
    }
    if(inside)clipped.push(point);
    previous=point;
  }
  return clipped;
}

function squareFraction(polygon,x,y,size) {
  let points=polygon.map(point=>[(point.x-x)/size,(point.y-y)/size]);
  for(const [axis,boundary,direction] of [[0,0,1],[0,1,-1],[1,0,1],[1,1,-1]]) {
    points=clipEdge(points,axis,boundary,direction);
  }
  let twiceArea=0;
  for(let i=0;i<points.length;i++) {
    const [x1,y1]=points[i];
    const [x2,y2]=points[(i+1)%points.length];
    twiceArea+=x1*y2-x2*y1;
  }
  const fraction=Math.min(1,Math.abs(twiceArea)/2);
  // A square exactly half covered counts even after round-off at clipped edges.
  return Math.abs(fraction-0.5)<=Number.EPSILON*8?0.5:fraction;
}

// The scene adapter supplies candidate squares and a simple contour in scene coordinates.
export function snapshotPolygonAreaTargets({sceneId,polygon,squares,size,tokens}) {
  if(!Number.isFinite(size)||size<=0)throw Error('O lado do quadrado deve ser positivo.');
  if(polygon.length<3||!polygon.every(({x,y})=>Number.isFinite(x)&&Number.isFinite(y))) {
    throw Error('A área exige um contorno com pelo menos três pontos válidos.');
  }
  const cellCoverage=squares.map(({cell,x,y})=>{
    if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('O quadrado exige uma posição válida.');
    return {cell,fraction:squareFraction(polygon,x,y,size)};
  });
  return snapshotSquareAreaTargets({sceneId,cellCoverage,tokens});
}

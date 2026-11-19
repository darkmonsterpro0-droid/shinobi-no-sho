import test from 'node:test';
import assert from 'node:assert/strict';
import {measureTokenDistance} from '../src/core/token-distance.mjs';
const grid={isSquare:true,size:100,getOffsetRange:({x,y,width,height})=>[Math.floor(y/100),Math.floor(x/100),Math.ceil((y+height)/100),Math.ceil((x+width)/100)],
 getCenterPoint:({i,j})=>({x:j*100+50,y:i*100+50}),measurePath:([a,b])=>({distance:Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))/100})};
const token=(x,y,width=1,height=1)=>({x,y,width,height,elevation:0});
test('nearest occupied cells determine reach for configured wide tokens and use the native diagonal metric',()=>{
 const source=token(0,0,3,2),target=token(300,100);
 assert.equal(measureTokenDistance(source,target,grid),1);
 assert.equal(measureTokenDistance(source,token(400,300),grid),2);
 assert.equal(measureTokenDistance(source,token(100,100),grid),0);
});
test('incompatible elevations or unmeasurable footprints require assisted measurement',()=>{
 assert.equal(measureTokenDistance(token(0,0),{...token(100,0),elevation:5},grid),null);
 assert.equal(measureTokenDistance(token(0,0,10000),token(100,0),grid),null);
 assert.equal(measureTokenDistance(token(0,0),token(100,0),{...grid,isSquare:false}),null);
});

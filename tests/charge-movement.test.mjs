import test from 'node:test';
import assert from 'node:assert/strict';
import {chargeEndpoint,moveCharge,chargeObstructed,lineChargeGeometry,prepareLineCharge} from '../src/charge-movement.mjs';
test('Ooiga uses a table-drawn five-metre rectangle and the native running metric without inventing a line length',()=>{
 const origin={x:50,y:50},polygon=[{x:350,y:-200},{x:950,y:-200},{x:950,y:300},{x:350,y:300}];
 const options={pixelsPerMetre:100,width:5,maximum:12};
 assert.equal(lineChargeGeometry(origin,polygon,options).travel,9);
 assert.deepEqual(lineChargeGeometry(origin,[...polygon].reverse(),options).endpoint,{x:950,y:50});
 assert.throws(()=>lineChargeGeometry(origin,polygon,{...options,maximum:8}),/além/);
 assert.throws(()=>lineChargeGeometry({x:50,y:60},polygon,options),/alinhada/);
 assert.throws(()=>lineChargeGeometry(origin,polygon.map(p=>({...p,y:p.y*2})),options),/5 m/);
 assert.throws(()=>lineChargeGeometry(origin,[...polygon.slice(0,3),{x:300,y:300}],options),/retângulo/);
 const near=[{x:50,y:-200},{x:250,y:-200},{x:250,y:300},{x:50,y:300}];
 assert.throws(()=>lineChargeGeometry(origin,near,options),/3 m/);
 const diagonal=polygon.map(({x,y})=>({x:(x-y)/Math.SQRT2,y:(x+y)/Math.SQRT2}));
 const rotatedOrigin={x:0,y:100/Math.SQRT2};
 assert.equal(lineChargeGeometry(rotatedOrigin,diagonal,{...options,measure:()=>7}).travel,7);
});
test('Ooiga validates scene geometry and walls without moving or spending while the trajectory remains assisted',()=>{
 const actor={uuid:'Actor.source'};let blocked=false;
 const source={actor,controlled:true,document:{id:'source',isOwner:true,getCenterPoint:()=>({x:50,y:50})},checkCollision:()=>blocked};
 const region={isSingleShape:true,polygons:[{points:[350,-200,950,-200,950,300,350,300]}]};
 globalThis.canvas={ready:true,scene:{id:'map',grid:{size:100,distance:1},regions:{get:()=>region}},grid:{isSquare:true,measurePath:()=>({distance:9})},tokens:{placeables:[source]}};
 assert.equal(prepareLineCharge(actor,'line',{maximum:12}).travel,9);
 blocked=true;assert.throws(()=>prepareLineCharge(actor,'line',{maximum:12}),/bloqueia/);
 delete globalThis.canvas;
});
test('charge follows a straight path, stops at reach, and validates its minimum and running distance',()=>{
 const origin={x:0,y:0},target={x:1000,y:0},options={reach:1,maximum:12,pixelsPerMetre:100};
 assert.deepEqual(chargeEndpoint(origin,target,options),{x:900,y:0,travel:9});
 assert.throws(()=>chargeEndpoint(origin,{x:200,y:0},options),/3 m/);
 assert.throws(()=>chargeEndpoint(origin,target,{...options,maximum:5}),/além/);
 const diagonal=chargeEndpoint(origin,{x:1000,y:1000},{...options,maximum:20});
 assert.equal(diagonal.x,diagonal.y);
});

test('charge respects configured footprints and the native diagonal distance without assuming a size-to-grid rule',()=>{
 const options={reach:2,maximum:12,pixelsPerMetre:100,sourceWidth:2,sourceHeight:2,targetWidth:3,targetHeight:3};
 const end=chargeEndpoint({x:0,y:0},{x:1000,y:0},options);
 assert.equal(end.x,650);assert.equal(end.travel,6.5);
 const diagonal=chargeEndpoint({x:0,y:0},{x:1000,y:1000},{...options,measure:(a,b)=>Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y))/100});
 assert.equal(diagonal.travel,6.5);assert.equal(diagonal.x,diagonal.y);
});
test('charge never ends on another creature, crosses its footprint or blocks mere edge contact',()=>{
 const origin={x:50,y:50},end={x:450,y:50},footprint={width:100,height:100};
 assert.equal(chargeObstructed(origin,end,footprint,[{x:400,y:0,width:100,height:100}]),true);
 assert.equal(chargeObstructed(origin,end,footprint,[{x:200,y:0,width:100,height:100}]),true);
 assert.equal(chargeObstructed(origin,end,footprint,[{x:200,y:100,width:100,height:100}]),false);
 assert.equal(chargeObstructed(origin,{x:450,y:450},footprint,[{x:200,y:200,width:100,height:100}]),true);
});
test('charge refuses blocked movement and preserves the controlled token and target selection',async()=>{
 const actor={uuid:'Actor.source'},target={actor:{uuid:'Actor.target'},document:{hidden:false,elevation:0,getCenterPoint:()=>({x:1000,y:0})}};
 let blocked=true,moves=0;
 const source={actor,controlled:true,document:{isOwner:true,elevation:0,x:0,y:0,getCenterPoint:()=>({x:0,y:0}),move:async()=>{moves++;return true;}},checkCollision:()=>blocked};
 globalThis.canvas={scene:{grid:{size:100,distance:1}},grid:{isSquare:true},tokens:{placeables:[source,target]}};
 await assert.rejects(moveCharge(actor,target.actor.uuid,{reach:1,maximum:12}),/bloqueia/);assert.equal(moves,0);
 blocked=false;await moveCharge(actor,target.actor.uuid,{reach:1,maximum:12});assert.equal(moves,1);assert.equal(source.controlled,true);
 delete globalThis.canvas;
});

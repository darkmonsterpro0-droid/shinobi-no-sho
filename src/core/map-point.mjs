// A map click without changing token control or the user's marked targets.
let cancelSelection;
export function selectMapPoint(label='Escolha o destino no mapa. Esc cancela.'){
 if(!canvas?.ready)throw Error('Abra a cena antes de escolher o destino.');
 cancelSelection?.();
 const view=canvas.app.view,previous=view.style.cursor;
 return new Promise(resolve=>{
  const notice=ui.notifications.info(label,{permanent:true});
  const finish=value=>{
   view.removeEventListener('pointerdown',click,true);
   document.removeEventListener('keydown',key,true);
   Hooks.off('canvasTearDown',tearDown);
   view.style.cursor=previous;ui.notifications.remove(notice);
   cancelSelection=null;resolve(value);
  };
  const click=event=>{
   if(![0,2].includes(event.button))return;
   event.preventDefault();event.stopImmediatePropagation();
   if(event.button===2)return finish(null);
   const bounds=view.getBoundingClientRect(),screen=canvas.app.screen;
   const point=canvas.stage.toLocal({x:(event.clientX-bounds.left)*screen.width/bounds.width,
    y:(event.clientY-bounds.top)*screen.height/bounds.height});
   finish({x:point.x,y:point.y});
  };
  const key=event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();finish(null);}};
  const tearDown=()=>finish(null);
  cancelSelection=tearDown;view.style.cursor='crosshair';
  view.addEventListener('pointerdown',click,true);document.addEventListener('keydown',key,true);
  Hooks.on('canvasTearDown',tearDown);
 });
}

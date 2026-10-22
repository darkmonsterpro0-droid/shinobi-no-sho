import {filterSurface} from "./ui.mjs";

export function readFields(root,prefix) {
  const values={};
  for(const el of root.querySelectorAll('[name]')) {
    if(prefix&&!el.name.startsWith(prefix))continue;
    if(el.disabled)continue;
    values[el.name]=el.type==="checkbox"?el.checked:el.type==="number"?(el.value===""?null:Number(el.value)):el.value;
  }
  return values;
}

export function bindSurface(root,adapter) {
  const abort=new AbortController();const options={signal:abort.signal};
  const run=async(fn)=>{try{await fn();}catch(error){adapter.error?.(error);}};
  root.addEventListener('click',e=>{const button=e.target.closest('button[data-sns]');if(!button||!root.contains(button))return;e.preventDefault();run(async()=>{
    if(button.disabled)return;button.disabled=true;
    try {await adapter.action(button.dataset.sns,button.dataset,root,button);} finally {if(button.isConnected)button.disabled=false;}
  });},options);
  root.addEventListener('change',e=>{
    const el=e.target;
    if(el.matches('[data-filter]')){filterSurface(root);return;}
    if(!el.name||!adapter.change)return;
    const value=el.type==="checkbox"?el.checked:el.type==="number"?(el.value===""?null:Number(el.value)):el.value;
    run(()=>adapter.change(el.name,value,el));
  },options);
  root.addEventListener('input',e=>{if(e.target.matches('[data-sns-search]'))filterSurface(root);},options);
  root.addEventListener('keydown',e=>{
    const current=e.target.closest('[role=tab]');if(!current)return;
    const tabs=[...root.querySelectorAll('[role=tab]')];let index=tabs.indexOf(current);
    if(e.key==='ArrowRight')index=(index+1)%tabs.length;
    else if(e.key==='ArrowLeft')index=(index-1+tabs.length)%tabs.length;
    else if(e.key==='Home')index=0;else if(e.key==='End')index=tabs.length-1;else return;
    e.preventDefault();const next=tabs[index];next.focus();run(()=>adapter.action('tab',next.dataset,root,next));
  },options);
  root.addEventListener('submit',e=>e.preventDefault(),options);
  filterSurface(root);
  return ()=>abort.abort();
}

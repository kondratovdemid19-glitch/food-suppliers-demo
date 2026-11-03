import './style.css';
import { mount } from './app';
import { suppliers, type Supplier } from './data';
const root=document.querySelector<HTMLElement>('#app')!;
const updateCatalog=mount(root);
const configured=document.querySelector<HTMLMetaElement>('meta[name="catalog-api"]')?.content;
const api=configured || ((location.hostname==='127.0.0.1' && location.port==='5198') || location.hostname.endsWith('.onrender.com') ? location.origin : '');
if(api) {
 const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),5000);
 fetch(api+'/api/suppliers',{signal:controller.signal,credentials:'omit'})
  .then(r=>{if(!r.ok) throw new Error('Catalog unavailable');return r.json();})
  .then(data=>{
   if(!Array.isArray(data.suppliers)||data.suppliers.length!==suppliers.length||!data.suppliers.every((s:Supplier)=>suppliers.some(known=>known.id===s.id && JSON.stringify(known)===JSON.stringify(s)))) throw new Error('Unexpected catalog');
   updateCatalog(data.suppliers);
   const mode=root.querySelector('#catalog-mode'); if(mode) mode.textContent='Каталог подключён · источники от 01–03.11.2026';
  })
  .catch(()=>{const mode=root.querySelector('#catalog-mode');if(mode)mode.textContent='Сервер недоступен · открыт встроенный каталог от 01–03.11.2026';})
  .finally(()=>clearTimeout(timeout));
}

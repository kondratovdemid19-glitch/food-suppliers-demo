import { categories, suppliers, type Category, type Supplier } from './data';
import { csvCell, findSuppliers, parseBrief, requestDraft, type Filters } from './domain';

const KEY = 'snabzhenie-workspace-v2';
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!));
const external = (url: string, text: string, source=false) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer" ${source?'data-source':''}>${escape(text)} <span aria-hidden="true">↗</span><span class="sr-only"> (новая вкладка)</span></a>`;
const date = (value: string) => value.split('-').reverse().join('.');
const phoneHref = (s: Supplier) => `tel:${s.phone.replace(/[^+\d]/g,'')}`;
const statuses = { new:'Не связывались', contacted:'Запрос отправлен', replied:'Есть ответ' };
type ContactStatus = keyof typeof statuses;

export function mount(root: HTMLElement, catalog: Supplier[] = suppliers, mode = 'Встроенный каталог') {
 const validId = (id: string) => catalog.some(s=>s.id===id);
 let selected = new Set<string>();
 let notes: Record<string,string> = {};
 let contactStatus: Record<string,ContactStatus> = {};
 let storageError=false;
 try {
  const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
  if(saved && typeof saved==='object') {
   selected=new Set(Array.isArray(saved.selected)?saved.selected.filter((id: unknown)=>typeof id==='string' && validId(id)).slice(0,3):[]);
   for(const [id,note] of Object.entries(saved.notes || {})) if(validId(id) && typeof note==='string') notes[id]=note.slice(0,1000);
   for(const [id,status] of Object.entries(saved.statuses || {})) if(validId(id) && typeof status==='string' && Object.hasOwn(statuses,status)) contactStatus[id]=status as ContactStatus;
  }
  if(!Object.keys(notes).length) {
   const old=JSON.parse(localStorage.getItem('snabzhenie-notes-v1')||'{}');
   for(const [id,note] of Object.entries(old || {})) if(validId(id) && typeof note==='string') notes[id]=note.slice(0,1000);
  }
 } catch { storageError=true; }
 const icon=`<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m5 11 11-6 11 6v13l-11 5-11-5V11Z" stroke="currentColor" stroke-width="1.8"/><path d="m5 11 11 6 11-6M16 17v12M11 8l11 6" stroke="currentColor" stroke-width="1.8"/></svg>`;
 root.innerHTML=`
 <a class="skip" href="#query">К поиску поставщиков</a>
 <header class="site-header"><a class="brand" href="#catalog">${icon}<span>снабжение<span class="brand-sub">Поставщики для кухни и магазина</span></span></a><div class="header-meta"><span class="demo-dot"></span>Демо-каталог<span class="header-divider">/</span><a href="#about">О данных</a></div></header>
 <main id="catalog">
  <div class="page-heading"><div><p class="eyebrow">Закупки · HoReCa и Retail</p><h1>С кем связаться по закупке?</h1><p>Подберите поставщиков, сравните условия и подготовьте запрос.</p></div><div class="catalog-mark"><strong>${catalog.length}</strong><span>компаний<br>с источниками</span></div></div>
  <section class="search-panel" aria-label="Условия закупки"><form id="search-form"><label class="query-label" for="query">Что нужно закупить?</label><div class="search-row"><div class="query-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg><input id="query" type="search" placeholder="Например, упаковка для доставки" autocomplete="off" maxlength="200"></div><div class="region-wrap"><label class="sr-only" for="region">Город или регион присутствия</label><input id="region" list="regions" placeholder="Город или регион" maxlength="100"><datalist id="regions">${[...new Set(catalog.flatMap(s=>s.regions))].sort().map(r=>`<option value="${escape(r)}">`).join('')}</datalist></div><button type="submit" class="primary">Найти поставщиков <span aria-hidden="true">→</span></button></div><div class="examples"><span>Попробуйте:</span><button type="button" data-example="packaging">Упаковка · Новосибирск</button><button type="button" data-example="bakery">Ингредиенты для выпечки</button><button type="button" data-example="ready">Готовая еда</button></div></form></section>
  <div class="workspace"><section class="catalog-body" aria-labelledby="results-title"><div class="catalog-toolbar"><div class="category-tabs" role="group" aria-label="Категория"><button data-category="" aria-pressed="true">Все</button>${Object.entries(categories).map(([id,label])=>`<button data-category="${id}" aria-pressed="false">${label}</button>`).join('')}</div><label class="sr-only" for="category">Категория</label><select id="category" class="sr-only" tabindex="-1"><option value="">Все категории</option>${Object.entries(categories).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></div>
  <div class="results-toolbar"><h2 id="results-title">Поставщики <span id="count"></span></h2><button class="text-button" data-reset>Сбросить фильтры</button></div><p id="result-status" class="result-status" role="status" aria-live="polite"></p><div id="results"></div></section>
  <aside class="shortlist" aria-labelledby="shortlist-title"><div class="shortlist-heading"><h2 id="shortlist-title">Мой список</h2><span id="selection-count">0 / 3</span></div><p class="small-copy">Соберите до трёх компаний.<br>Выбор сохранится в этом браузере.</p><div id="shortlist-items"></div><div class="shortlist-actions"><button id="open-compare" class="secondary" disabled>Сравнить условия</button><button id="make-request" class="primary" disabled>Подготовить запрос <span aria-hidden="true">↗</span></button><button id="clear-compare" class="text-button" hidden>Очистить список</button></div><div class="source-note"><span class="source-mark" aria-hidden="true">i</span><div><strong>Проверьте до заказа</strong><p>Город — подтверждённое присутствие компании, а не обещание доставки. Цену, партию и документы уточняйте у поставщика.</p></div></div></aside></div>
  <section id="about" class="about"><h2>От подбора — к конкретному предложению</h2><div class="about-grid"><div><span class="step-label">Подбор</span><h3>Найдите свой ассортимент</h3><p>По названию, продукции и городу. Источники открываются прямо из карточки.</p></div><div><span class="step-label">Сравнение</span><h3>Посмотрите условия рядом</h3><p>Цена без предложения не угадывается. Вы сразу видите, какие вопросы ещё нужно задать.</p></div><div><span class="step-label">Запрос</span><h3>Запросите одинаковые условия</h3><p>Укажите объём и адрес, сохраните черновик и отправьте его выбранным компаниям самостоятельно.</p></div></div></section>
  <footer><div><strong>снабжение</strong><span>Прототип для поиска поставщиков продуктов питания.</span></div><div><span id="catalog-mode">${escape(mode)} · источники от 01–03.11.2026</span><span id="storage-status" role="status">${storageError?'Хранилище недоступно или данные повреждены. Проверьте сохранение заметок.':'Списки и заметки остаются в этом браузере.'}</span></div></footer>
 </main>
 <dialog id="comparison" aria-labelledby="comparison-title" hidden></dialog>
 <dialog id="request-dialog" aria-labelledby="request-title"><div class="dialog-top"><div><p class="eyebrow">Следующий шаг</p><h2 id="request-title">Запрос условий закупки</h2></div><button data-close="request-dialog" class="icon-button" aria-label="Закрыть запрос">×</button></div><p class="dialog-intro">Черновик для выбранных компаний. Уточните товар и объём, затем скопируйте текст. Сервис ничего не отправляет.</p><div class="request-fields"><div><label for="purchase-need">Товар и объём</label><input id="purchase-need" placeholder="Контейнеры 500 мл, 1 000 шт." maxlength="300"></div><div><label for="purchase-city">Город или адрес поставки</label><input id="purchase-city" placeholder="Екатеринбург" maxlength="200"></div></div><label for="request-text">Текст запроса · можно отредактировать</label><textarea id="request-text" rows="13" maxlength="6000"></textarea><div class="dialog-actions"><span id="copy-status" role="status"></span><button id="download-request" class="secondary">Скачать .txt</button><button id="copy-request" class="primary">Скопировать текст</button></div></dialog>`;
 const $=<T extends HTMLElement = HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
 const save=()=>{try {localStorage.setItem(KEY,JSON.stringify({selected:[...selected],notes,statuses:contactStatus})); $('#storage-status').textContent='Изменения сохранены в этом браузере.';} catch {$('#storage-status').textContent='Не удалось сохранить изменения. Скопируйте заметки перед закрытием страницы.';} };
 const filters=():Filters=>({query:$<HTMLInputElement>('#query').value,category:$<HTMLSelectElement>('#category').value as Category|'',region:$<HTMLInputElement>('#region').value});
 const list=()=>catalog.filter(s=>selected.has(s.id));
 const open=(id:string)=>{const d=$<HTMLDialogElement>('#'+id); d.hidden=false; typeof d.showModal==='function'?d.showModal():d.setAttribute('open','');};
 const close=(id:string)=>{const d=$<HTMLDialogElement>('#'+id); typeof d.close==='function'?d.close():d.removeAttribute('open'); if(id==='comparison') d.hidden=true; $(id==='comparison'?'#open-compare':'#make-request').focus();};
 const download=(text:string,type:string,name:string)=>{const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const sourceLinks=(s:Supplier)=>s.sources.map(source=>external(source.url,source.label,true)).join('');
 function renderCard(s:Supplier) {
  const f=filters();
  const reason=f.region?`Есть присутствие: ${f.region}`:s.categories.map(c=>categories[c]).join(' · ');
  return `<article class="supplier-card ${selected.has(s.id)?'is-selected':''}" aria-labelledby="name-${s.id}"><div class="card-top"><div class="supplier-symbol symbol-${s.id}" aria-hidden="true">${escape(s.short)}</div><div class="card-title"><p class="supplier-kind">${s.categories.map(c=>categories[c]).join(' · ')}</p><h3 id="name-${s.id}">${escape(s.name)}</h3></div><button class="compare-toggle ${selected.has(s.id)?'chosen':''}" data-compare="${s.id}" aria-pressed="${selected.has(s.id)}" ${selected.size>=3&&!selected.has(s.id)?'disabled title="В списке уже три компании. Уберите одну, чтобы добавить другую."':''}><span aria-hidden="true">${selected.has(s.id)?'✓':'+'}</span> ${selected.has(s.id)?'В списке':'В список'}<span class="sr-only"> ${escape(s.name)}</span></button></div><p class="description">${escape(s.description)}</p><div class="match-reason"><span aria-hidden="true">↳</span> ${escape(reason)}<span class="source-date">Источник ${date(s.checkedAt)}</span></div><dl class="facts"><div><dt>Присутствие</dt><dd>${escape(s.presence)}</dd></div><div><dt>Минимальный заказ</dt><dd>${escape(s.minimum)}</dd></div></dl><div class="card-bottom"><a class="phone" href="${phoneHref(s)}">${escape(s.phone)}</a><details class="supplier-details"><summary>Условия и источники <span aria-hidden="true">↓</span></summary><dl class="detail-facts"><div><dt>Доставка</dt><dd>${escape(s.delivery)}</dd></div><div><dt>Цена</dt><dd>${escape(s.price)}</dd></div><div><dt>Документы</dt><dd>${escape(s.documents)}</dd></div></dl><div class="clarify"><strong>Что уточнить</strong><p>${escape(s.clarify)}</p></div><div class="sources">${sourceLinks(s)}</div><div class="detail-contact">${external(s.website,'Сайт поставщика')}${s.email?`<a href="mailto:${escape(s.email)}">${escape(s.email)}</a>`:''}</div><p class="field-hint">Источники проверены ${date(s.checkedAt)}. Наличие товара, цены и документы на конкретный артикул не подтверждались.</p><div class="work-note"><label for="status-${s.id}">Связь с поставщиком</label><select id="status-${s.id}" data-status="${s.id}">${Object.entries(statuses).map(([value,label])=>`<option value="${value}" ${contactStatus[s.id]===value?'selected':''}>${label}</option>`).join('')}</select><label for="note-${s.id}">Ваша заметка</label><textarea id="note-${s.id}" data-note="${s.id}" maxlength="1000" rows="2" placeholder="Например, запросить образцы">${escape(notes[s.id]||'')}</textarea></div></details></div></article>`;
 }
 function renderComparison() {
  const d=$('#comparison'); if(d.hidden) return;
  const chosen=list();
  const mixed = new Set(chosen.flatMap(s=>s.categories)).size>1;
  const rows:[string,(s:Supplier)=>string][]=[['Ассортимент',s=>s.description],['Присутствие',s=>s.presence],['Доставка',s=>s.delivery],['Минимальный заказ',s=>s.minimum],['Цена',s=>s.price],['Документы',s=>s.documents],['Что уточнить',s=>s.clarify],['Связь',s=>statuses[contactStatus[s.id]||'new']],['Ваша заметка',s=>notes[s.id]||'—']];
  d.innerHTML=`<div class="dialog-top"><div><p class="eyebrow">Мой список · выбрано: ${chosen.length}</p><h2 id="comparison-title">Сравнение условий</h2></div><button data-close="comparison" class="icon-button" aria-label="Закрыть сравнение">×</button></div>${mixed?'<p class="notice">В списке разные категории. Эти поставщики могут дополнять друг друга; сравнение не определяет победителя.</p>':''}${chosen.length?`<div class="table-scroll" tabindex="0" role="region" aria-label="Таблица сравнения, можно прокручивать"><table><caption class="sr-only">Условия выбранных поставщиков</caption><thead><tr><th scope="col">Условия</th>${chosen.map(s=>`<th scope="col">${escape(s.name)}<button data-remove="${s.id}" class="text-button remove" aria-label="Убрать ${escape(s.name)} из сравнения">Убрать ×</button></th>`).join('')}</tr></thead><tbody>${rows.map(([title,read])=>`<tr><th scope="row">${title}</th>${chosen.map(s=>`<td>${escape(read(s))}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">Контакты</th>${chosen.map(s=>`<td><a href="${phoneHref(s)}">${escape(s.phone)}</a><br>${external(s.website,'Официальный сайт')}</td>`).join('')}</tr></tbody></table></div><div class="dialog-actions"><button id="export-csv" class="secondary">Скачать сравнение .csv</button><button id="request-from-compare" class="primary">Подготовить запрос →</button></div>`:'<p class="dialog-intro">Список пуст. Закройте сравнение и добавьте компании из каталога.</p>'}`;
 }
 function render() {
  const expanded=[...root.querySelectorAll<HTMLDetailsElement>('details[open]')].map(d=>d.closest('article')?.getAttribute('aria-labelledby'));
  const f=filters(); const visible=findSuppliers(catalog,f);
  $('#count').textContent=String(visible.length);
  $('#result-status').textContent=f.region?`Найдено ${visible.length} · присутствие в регионе «${f.region}». Доставка требует подтверждения.`:`${visible.length} из ${catalog.length} компаний · по названию · данные из официальных источников`;
  $('#results').innerHTML=visible.length?visible.map(renderCard).join(''):`<div class="empty">${icon}<h3>Ничего не найдено</h3><p>Нет совпадений в этом каталоге. Сократите название товара или уберите город. Каталог неполный: это не означает, что поставщиков в регионе нет.</p><button class="secondary" data-reset>Показать всех поставщиков</button></div>`;
  root.querySelectorAll<HTMLDetailsElement>('details').forEach(d=>{d.open=expanded.includes(d.closest('article')?.getAttribute('aria-labelledby'));});
  root.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===f.category)));
  $('#selection-count').textContent=`${selected.size} / 3`;
  $('.shortlist').dataset.empty=String(selected.size===0);
  $('#shortlist-items').innerHTML=selected.size?list().map(s=>`<div class="shortlist-item"><span class="mini-symbol symbol-${s.id}">${escape(s.short)}</span><div><strong>${escape(s.name)}</strong><span>${statuses[contactStatus[s.id]||'new']}</span></div><button data-remove="${s.id}" class="icon-button" aria-label="Убрать ${escape(s.name)} из списка">×</button></div>`).join(''):`<div class="shortlist-empty">${icon}<strong>Здесь будет ваш выбор</strong><p>Нажмите «В список» у подходящих поставщиков.</p></div>`;
  $<HTMLButtonElement>('#open-compare').disabled=selected.size===0; $<HTMLButtonElement>('#make-request').disabled=selected.size===0; $('#clear-compare').hidden=selected.size===0;
  renderComparison();
 }
 function prepareRequest() {
  $<HTMLInputElement>('#purchase-city').value=filters().region;
  $<HTMLInputElement>('#purchase-need').value=filters().query;
  $<HTMLTextAreaElement>('#request-text').value=requestDraft(list(),filters().query,filters().region);
  $('#copy-status').textContent=''; open('request-dialog');
 }
 root.oninput=event=>{const t=event.target as HTMLInputElement; if(t.dataset.note) {notes[t.dataset.note]=t.value.slice(0,1000);save();} else if(['query','region','category'].includes(t.id)) render(); else if(['purchase-need','purchase-city'].includes(t.id)) $<HTMLTextAreaElement>('#request-text').value=requestDraft(list(),$<HTMLInputElement>('#purchase-need').value,$<HTMLInputElement>('#purchase-city').value);};
 root.onchange=event=>{const t=event.target as HTMLSelectElement; if(t.dataset.status && Object.hasOwn(statuses,t.value)) {contactStatus[t.dataset.status]=t.value as ContactStatus; save(); render();} else if(t.id==='category') render();};
 root.onsubmit=event=>{event.preventDefault();const p=parseBrief(filters().query); $<HTMLInputElement>('#query').value=p.query; if(p.category) $<HTMLSelectElement>('#category').value=p.category; if(p.region) $<HTMLInputElement>('#region').value=p.region; render();};
 root.onclick=async event=>{
  const btn=(event.target as HTMLElement).closest<HTMLButtonElement>('button'); if(!btn||btn.disabled) return;
  if(btn.hasAttribute('data-reset')) {['query','region','category'].forEach(id=>{$<HTMLInputElement>('#'+id).value='';});render();$('#query').focus();}
  if(btn.dataset.category!==undefined) {$<HTMLSelectElement>('#category').value=btn.dataset.category;render();}
  if(btn.dataset.example) {const examples:Record<string,Filters>={packaging:{query:'упаковка',category:'packaging',region:'Новосибирск'},bakery:{query:'выпечк',category:'ingredients',region:''},ready:{query:'',category:'ready',region:''}};const f=examples[btn.dataset.example];$<HTMLInputElement>('#query').value=f.query;$<HTMLSelectElement>('#category').value=f.category;$<HTMLInputElement>('#region').value=f.region;render();}
  if(btn.dataset.compare) {const id=btn.dataset.compare;selected.has(id)?selected.delete(id):selected.size<3&&selected.add(id);save();render();root.querySelector<HTMLElement>(`[data-compare="${id}"]`)?.focus();}
  if(btn.dataset.remove) {selected.delete(btn.dataset.remove);save();render();}
  if(btn.id==='clear-compare') {selected.clear();save();render();}
  if(btn.id==='open-compare') {$('#comparison').hidden=false;renderComparison();open('comparison');}
  if(btn.dataset.close) close(btn.dataset.close);
  if(btn.id==='make-request') prepareRequest();
  if(btn.id==='request-from-compare') {close('comparison');prepareRequest();}
  if(btn.id==='download-request') download($<HTMLTextAreaElement>('#request-text').value,'text/plain;charset=utf-8','Запрос поставщикам.txt');
  if(btn.id==='copy-request') {try {await navigator.clipboard.writeText($<HTMLTextAreaElement>('#request-text').value);$('#copy-status').textContent='Текст скопирован';}catch {$('#copy-status').textContent='Выделите текст и скопируйте вручную или скачайте файл.';$<HTMLTextAreaElement>('#request-text').select();}}
  if(btn.id==='export-csv') {const rows=[['Поставщик','Ассортимент','Присутствие','Доставка','Минимальный заказ','Цена','Документы','Сайт','Проверено','Заметка'],...list().map(s=>[s.name,s.description,s.presence,s.delivery,s.minimum,s.price,s.documents,s.website,s.checkedAt,notes[s.id]||''])];download('\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n'),'text/csv;charset=utf-8','Сравнение поставщиков.csv');}
 };
 render();
 return (next: Supplier[]) => { catalog=[...next].sort((a,b)=>a.name.localeCompare(b.name,'ru')); };
}

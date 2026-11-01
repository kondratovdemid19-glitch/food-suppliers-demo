import { categories, suppliers, type Category, type Supplier } from './data';
const KEY = 'snabzhenie-notes-v1';
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const normalize = (value: string) => value.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
const link = (url: string, label: string, source = false) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer" ${source ? 'data-source' : ''}>${escape(label)} <span aria-hidden="true">↗</span><span class="sr-only"> (откроется в новой вкладке)</span></a>`;
export function mount(root: HTMLElement) {
 let selected = new Set<string>();
 let notes: Record<string, string> = {};
 let storageAvailable = true;
 try {
  const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || '{}');
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
   notes = Object.fromEntries(Object.entries(parsed).filter(([id, val]) => suppliers.some(s => s.id === id) && typeof val === 'string').map(([id, val]) => [id, (val as string).slice(0, 1000)]));
  }
 } catch { storageAvailable = false; }
 root.innerHTML = `
 <a class="skip" href="#catalog">К поставщикам</a>
 <header class="site-header"><a class="brand" href="#catalog"><span class="brand-symbol" aria-hidden="true">с</span>снабжение<span class="brand-sub">для пищевого бизнеса</span></a><span class="prototype">Учебный прототип</span></header>
 <main>
  <section class="intro" aria-labelledby="title"><div><p class="eyebrow">Продукты · ингредиенты · упаковка</p><h1 id="title">Найдите поставщика.<br><span>Уточните главное.</span></h1><p class="intro-text">Соберите короткий список, сравните условия<br class="desktop-break"> и переходите к разговору с поставщиком.</p></div><aside class="data-note"><span class="small-label">О данных</span><strong>4 реальных компании</strong><p>Снимок официальных сайтов на 01.11.2026. Условия сделки и доставку нужно подтвердить напрямую.</p><a href="#method">Как устроен каталог ↓</a></aside></section>
  <section class="workspace" id="catalog" aria-label="Поиск поставщиков">
   <aside class="filters"><div class="section-label">Ваш запрос</div><label for="query">Что ищете?</label><div class="search-wrap"><span aria-hidden="true">⌕</span><input id="query" type="search" placeholder="Название, продукт…" autocomplete="off"></div>
    <label for="category">Категория</label><select id="category"><option value="">Все категории</option>${Object.entries(categories).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select>
    <label for="region">Город или регион присутствия</label><input id="region" list="regions" placeholder="Например, Новосибирск" autocomplete="off"><datalist id="regions"><option value="Москва и область"><option value="Подольск"><option value="Новосибирск"><option value="Санкт-Петербург"></datalist>
    <p class="field-hint">Ищем по подтверждённым офисам и отделам продаж. Это не гарантия доставки. Неизвестная география в результат не попадёт.</p>
    <button class="text-button reset" data-reset>Сбросить фильтры</button>
    <div class="help-box"><strong>С чего начать?</strong><p>Для выпечки — ингредиенты. Для перепродажи или питания — готовая продукция. Для фасовки — упаковка.</p></div>
   </aside>
   <div class="catalog-body"><div class="results-toolbar"><div><h2>Поставщики <span id="count"></span></h2><p id="result-status" role="status" aria-live="polite"></p></div><span class="sort-label">По названию ↓</span></div><div id="results"></div></div>
  </section>
  <section id="comparison" class="comparison" tabindex="-1" hidden aria-labelledby="comparison-title"></section>
  <section id="method" class="method"><div><p class="eyebrow">Принцип каталога</p><h2>Что проверить<br>перед закупкой.</h2></div><div><p>Здесь нет оценки «лучший поставщик»: без объёма закупки, адреса и коммерческого предложения она была бы условной. Сравните специализацию и контакты, затем запросите одинаковые условия у двух-трёх компаний.</p><p>Каталог демонстрационный и неполный. «Не установлено» означает, что информация не подтверждена выбранными источниками, а не что условие отсутствует. Контакты переписаны с официальных сайтов; ответ поставщиков не проверялся.</p><p><strong>Перед заказом:</strong> уточните цену с НДС, минимальную партию, срок поставки и документы на конкретный товар.</p></div></section>
  <footer><span>Снабжение · тестовое задание</span><span id="storage-status" role="status">${storageAvailable ? 'Заметки хранятся только в этом браузере.' : 'Хранилище недоступно или данные повреждены. Проверьте сохранение заметок.'}</span></footer>
 </main>
 <div class="compare-bar"><div><strong id="selection-count">Ничего не выбрано</strong><span id="selection-hint">Добавьте до 3 поставщиков для сравнения</span></div><button id="clear-compare" class="text-button" hidden>Очистить</button><button id="open-compare" class="primary" disabled>Сравнить <span aria-hidden="true">→</span></button></div>`;
 const $ = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
 const status = (text: string) => { $('#storage-status').textContent = text; };
 const renderCard = (s: Supplier) => `<article class="supplier-card" aria-labelledby="name-${s.id}">
 <div class="card-top"><div class="supplier-symbol symbol-${s.id}" aria-hidden="true">${s.short}</div><div class="card-title"><div class="tags">${s.categories.map(c => `<span>${categories[c]}</span>`).join('')}</div><h3 id="name-${s.id}">${s.name}</h3></div><button class="compare-toggle ${selected.has(s.id) ? 'chosen' : ''}" data-compare="${s.id}" aria-pressed="${selected.has(s.id)}" ${selected.size >= 3 && !selected.has(s.id) ? 'disabled title="Можно сравнить до трёх поставщиков. Снимите один из выбранных."' : ''}><span aria-hidden="true">${selected.has(s.id) ? '✓' : '+'}</span> ${selected.has(s.id) ? 'В сравнении' : 'Сравнить'}<span class="sr-only"> ${s.name}</span></button></div>
 <p class="description">${s.description}</p>
 <dl class="facts"><div><dt>Присутствие</dt><dd>${s.presence}</dd></div><div><dt>Доставка</dt><dd>${s.delivery}</dd></div><div><dt>Минимальный заказ</dt><dd>${s.minimum}</dd></div><div><dt>Цена</dt><dd>${s.price}</dd></div></dl>
 <div class="clarify"><span aria-hidden="true">?</span><div><strong>Перед закупкой уточните</strong><p>${s.clarify}</p></div></div>
 <div class="contact-row"><a class="phone" href="tel:${s.phone.replace(/[^+\d]/g, '')}">${s.phone}</a>${s.email ? `<a href="mailto:${s.email}">${s.email}</a>` : ''}${link(s.website, 'Сайт поставщика')}</div>
 <details><summary>Источники и документы</summary><p>${s.documents}. Наличие действующих документов на конкретный товар не проверялось.</p><div class="sources">${s.sources.map(source => link(source.url, source.label, true)).join('')}</div><p class="field-hint">Проверено по открытым страницам 01.11.2026.</p></details>
 <div class="note-area"><label for="note-${s.id}">Ваша заметка <span>только в этом браузере</span></label><textarea id="note-${s.id}" data-note="${s.id}" maxlength="1000" rows="2" placeholder="Например, запросить образцы и прайс">${escape(notes[s.id] || '')}</textarea></div>
 </article>`;
 function renderComparison() {
  const list = suppliers.filter(s => selected.has(s.id));
  const comparison = $('#comparison');
  if (comparison.hidden) return;
  comparison.innerHTML = `<div class="comparison-heading"><div><p class="eyebrow">Короткий список</p><h2 id="comparison-title">Сравнение поставщиков</h2></div><button id="close-compare" class="text-button">Закрыть сравнение ↑</button></div>${list.length ? `<p>Сравнивайте компании одной категории. Разные профили могут дополнять друг друга.</p><div class="table-scroll" tabindex="0" role="region" aria-label="Таблица сравнения, можно прокручивать"><table><caption class="sr-only">Условия выбранных поставщиков</caption><thead><tr><th scope="col">Что сравниваем</th>${list.map(s => `<th scope="col">${s.name}<button data-remove="${s.id}" class="remove" aria-label="Убрать ${s.name} из сравнения">Убрать ×</button></th>`).join('')}</tr></thead><tbody>${([
 ['Категория', (s: Supplier) => s.categories.map(c => categories[c]).join(', ')],
 ['Ассортимент', (s: Supplier) => s.description], ['Присутствие', (s: Supplier) => s.presence],
 ['Доставка', (s: Supplier) => s.delivery], ['Минимальный заказ', (s: Supplier) => s.minimum],
 ['Цена', (s: Supplier) => s.price], ['Документы', (s: Supplier) => s.documents],
 ['Что уточнить', (s: Supplier) => s.clarify], ['Ваша заметка', (s: Supplier) => notes[s.id] || 'Заметки нет'],
 ] as [string, (s: Supplier) => string][]).map(([name, read]) => `<tr><th scope="row">${name}</th>${list.map(s => `<td>${escape(read(s))}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">Контакты и источник</th>${list.map(s => `<td><a href="tel:${s.phone.replace(/[^+\d]/g, '')}">${s.phone}</a><br>${link(s.website, 'Официальный сайт')}</td>`).join('')}</tr></tbody></table></div>` : '<p>В списке пока никого нет. Добавьте поставщиков из каталога.</p>'}`;
 }
 function render() {
  const query = normalize($<HTMLInputElement>('#query').value);
  const region = normalize($<HTMLInputElement>('#region').value);
  const category = $<HTMLSelectElement>('#category').value as Category | '';
  const filtered = suppliers.filter(s => (!category || s.categories.includes(category)) && (!region || s.regions.some(r => normalize(r).includes(region))) && (!query || normalize([s.name, s.description, ...s.categories.map(c => categories[c])].join(' ')).includes(query)));
  $('#count').textContent = String(filtered.length);
  $('#result-status').textContent = `Найдено ${filtered.length} из ${suppliers.length} · официальные источники`;
  $('#results').innerHTML = filtered.length ? filtered.map(renderCard).join('') : `<div class="empty"><span class="empty-symbol" aria-hidden="true">⌕</span><h3>Ничего не найдено</h3><p>В небольшом каталоге нет совпадений. Попробуйте другую категорию, сократите запрос или уберите город. Это не означает, что поставщиков в регионе нет.</p><button data-reset class="primary">Показать всех поставщиков</button></div>`;
  $('#selection-count').textContent = selected.size ? `Выбрано: ${selected.size} из 3` : 'Ничего не выбрано';
  $('#selection-hint').textContent = selected.size === 3 ? 'Чтобы добавить другого, снимите один из выбранных' : 'Добавьте до 3 поставщиков для сравнения';
  $<HTMLButtonElement>('#open-compare').disabled = selected.size === 0;
  $('#clear-compare').hidden = selected.size === 0;
  renderComparison();
 }
 root.oninput = event => {
  const target = event.target as HTMLInputElement;
  if (target.dataset.note) {
   notes[target.dataset.note] = target.value.slice(0, 1000);
   try { localStorage.setItem(KEY, JSON.stringify(notes)); status('Заметка сохранена в этом браузере.'); }
   catch { status('Не удалось сохранить заметку. Скопируйте её перед закрытием страницы.'); }
   renderComparison();
  } else if (['query', 'category', 'region'].includes(target.id)) render();
 };
 root.onclick = event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!button || button.disabled) return;
  if (button.hasAttribute('data-reset')) { ['query', 'region', 'category'].forEach(id => { $<HTMLInputElement>(`#${id}`).value = ''; }); render(); $('#query').focus(); }
  if (button.dataset.compare) { const id = button.dataset.compare; selected.has(id) ? selected.delete(id) : selected.size < 3 && selected.add(id); render(); root.querySelector<HTMLElement>(`[data-compare="${id}"]`)?.focus(); }
  if (button.dataset.remove) { selected.delete(button.dataset.remove); render(); $('#comparison').focus(); }
  if (button.id === 'clear-compare') { selected = new Set(); render(); }
  if (button.id === 'open-compare') { $('#comparison').hidden = false; renderComparison(); $('#comparison').focus(); }
  if (button.id === 'close-compare') { $('#comparison').hidden = true; $('#open-compare').focus(); }
 };
 render();
}

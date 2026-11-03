// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '../src/app';
const input = (id: string, value: string) => { const el = document.querySelector<HTMLInputElement | HTMLSelectElement>(id)!; el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); };
const click = (id: string) => document.querySelector<HTMLButtonElement>(id)!.click();
const count = () => document.querySelectorAll('.supplier-card').length;
beforeEach(() => { localStorage.clear(); document.body.innerHTML = '<div id="app"></div>'; mount(document.querySelector('#app')!); });
describe('каталог', () => {
 it('показывает 6 компаний и официальные источники', () => { expect(count()).toBe(6); expect(document.querySelectorAll('a[data-source]').length).toBeGreaterThanOrEqual(4); });
 it('совмещает категорию и регион, очищает пустой поиск', () => { input('#category', 'packaging'); input('#region', 'Новосибирск'); expect(count()).toBe(1); expect(document.querySelector('.supplier-card')!.textContent).toContain('КОМУС'); input('#query', 'несуществующий'); expect(count()).toBe(0); expect(document.querySelector('#results')!.textContent).toContain('Ничего не найдено'); click('[data-reset]'); expect(count()).toBe(6); });
 it('ищет без учёта регистра и внешних пробелов', () => { input('#query', '  пУРАТОС  '); expect(count()).toBe(1); });
 it('не выдаёт неизвестную географию за подтверждённую', () => { input('#category', 'ready'); input('#region', 'Новосибирск'); expect(count()).toBe(0); });
});
describe('сравнение и заметки', () => {
 it('сохраняет выбор при фильтрах и удаляет из сравнения', () => { click('[data-compare="puratos"]'); input('#category', 'packaging'); click('[data-compare="komus"]'); click('#open-compare'); expect(document.querySelectorAll('table th[scope="col"]').length).toBe(3); expect(document.querySelector('table')!.textContent).toContain('ПУРАТОС'); click('[data-remove="puratos"]'); expect(document.querySelector('table')!.textContent).not.toContain('ПУРАТОС'); });
 it('ограничивает выбор тремя и разрешает снять выбор', () => { click('[data-compare="puratos"]'); click('[data-compare="komus"]'); click('[data-compare="metro"]'); expect(document.querySelector<HTMLButtonElement>('[data-compare="vkusvill"]')!.disabled).toBe(true); click('[data-compare="puratos"]'); expect(document.querySelector<HTMLButtonElement>('[data-compare="vkusvill"]')!.disabled).toBe(false); });
 it('сохраняет заметку после повторного открытия без HTML-инъекции', () => { input('[data-note="puratos"]', '<img src=x onerror=alert(1)>'); mount(document.querySelector('#app')!); expect(document.querySelector<HTMLTextAreaElement>('[data-note="puratos"]')!.value).toBe('<img src=x onerror=alert(1)>'); expect(document.querySelector('img')).toBeNull(); });
 it('переживает повреждённые данные хранилища', () => { localStorage.setItem('snabzhenie-notes-v1', 'broken{'); mount(document.querySelector('#app')!); expect(count()).toBe(6); });
 it('не обещает сохранение при отказе хранилища', () => { vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); }); input('[data-note="puratos"]', 'позвонить'); expect(document.querySelector('#storage-status')!.textContent).toContain('Не удалось'); vi.restoreAllMocks(); });
});

describe('рабочий список закупщика', () => {
 it('восстанавливает выбранные компании после перезагрузки', () => { click('[data-compare="puratos"]'); mount(document.querySelector('#app')!); expect(document.querySelector('[data-compare="puratos"]')!.getAttribute('aria-pressed')).toBe('true'); });
 it('сохраняет статус контакта после перезагрузки', () => { const el=document.querySelector<HTMLSelectElement>('[data-status="puratos"]')!; expect(el).not.toBeNull(); el.value='contacted'; el.dispatchEvent(new Event('change',{bubbles:true})); mount(document.querySelector('#app')!); expect(document.querySelector<HTMLSelectElement>('[data-status="puratos"]')!.value).toBe('contacted'); });
 it('показывает запрос условий по выбранным поставщикам', () => { click('[data-compare="puratos"]'); click('#make-request'); expect(document.querySelector<HTMLTextAreaElement>('#request-text')!.value).toContain('ПУРАТОС'); });
 it('разбирает пример закупочного запроса', () => { click('[data-example="packaging"]'); expect(count()).toBe(1); expect(document.querySelector('#results')!.textContent).toContain('КОМУС'); });
});

describe('раскрытые условия',()=>{
 it('не закрывает карточку при смене статуса',()=>{
  const card=document.querySelector('[aria-labelledby="name-puratos"]')!;
  card.querySelector('details')!.open=true;
  const status=card.querySelector<HTMLSelectElement>('[data-status]')!;
  status.value='contacted';status.dispatchEvent(new Event('change',{bubbles:true}));
  expect(document.querySelector('[aria-labelledby="name-puratos"] details')!.hasAttribute('open')).toBe(true);
 });
});

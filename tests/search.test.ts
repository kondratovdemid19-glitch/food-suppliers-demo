import { describe, it, expect } from 'vitest';
import { findSuppliers, parseBrief, csvCell, requestDraft } from '../src/domain';
import { suppliers } from '../src/data';
describe('закупочный запрос', () => {
 it('понимает упаковку и город в обычной фразе', () => { const p = parseBrief('упаковка для доставки в Новосибирске'); expect(p.category).toBe('packaging'); expect(p.region).toBe('Новосибирск'); expect(findSuppliers(suppliers, p).map(s => s.id)).toContain('komus'); });
 it('ищет товар с русским окончанием', () => { expect(findSuppliers(suppliers, {query:'закваска',category:'',region:''}).map(s => s.id)).toContain('puratos'); });
 it('не игнорирует незнакомый товар', () => { expect(findSuppliers(suppliers, parseBrief('единорог'))).toHaveLength(0); });
 it('не приписывает неизвестному региону доставку', () => { expect(findSuppliers(suppliers, {query:'', category:'ready',region:'Новосибирск'})).toHaveLength(0); });
 it('нейтрализует формулы CSV, кавычки и переводы строк', () => { expect(csvCell('=1+1')).toBe('"\'=1+1"'); expect(csvCell('a"b\nc')).toBe('"a""b\nc"'); });
 it('готовит предметные вопросы без вымышленных условий', () => { const draft=requestDraft([suppliers.find(s=>s.id==='komus')!], 'Контейнеры 500 мл, 1000 шт', 'Екатеринбург'); expect(draft).toContain('1000 шт'); expect(draft).toContain('НДС'); expect(draft).toContain('Екатеринбург'); expect(draft).toContain('документ'); });
});

describe('пекарня',()=>{
 it('находит поставщика по слову выпечка, а не только его названию',()=>{
  expect(findSuppliers(suppliers,{query:'выпечка',category:'ingredients',region:''}).map(s=>s.id)).toContain('puratos');
 });
});

import type { Category, Supplier } from './data';
export type Filters = { query: string; category: Category | ''; region: string };
export const normalize = (v: string) => v.toLocaleLowerCase('ru').replaceAll('ё','е').trim();
const stem = (word: string) => word.length > 4 ? word.replace(/(ами|ями|ого|ему|ов|ам|ом|ах|ях|ый|ий|ая|ые|ое|ой|ку|ки|ка|ы|и|а|е|у)$/u,'') : word;
const words = (v: string) => normalize(v).split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(stem);
const cityPatterns: [RegExp, string][] = [[/новосибирск[а-я]*/gi,'Новосибирск'],[/екатеринбург[а-я]*/gi,'Екатеринбург'],[/москв[а-я]*/gi,'Москва'],[/санкт[ -]петербург[а-я]*|петербург[а-я]*/gi,'Санкт-Петербург'],[/краснодар[а-я]*/gi,'Краснодар'],[/красноярск[а-я]*/gi,'Красноярск'],[/подольск[а-я]*/gi,'Подольск'],[/хабаровск[а-я]*/gi,'Хабаровск']];
export function parseBrief(text: string): Filters {
 let query = normalize(text); let region = ''; let category: Category | '' = '';
 for(const [pattern, city] of cityPatterns) { pattern.lastIndex=0; if(pattern.test(query)) {region=city; pattern.lastIndex=0; query=query.replace(pattern,' '); break;} }
 if(/упаков|контейнер|ланч[ -]?бокс|стакан|пакет/u.test(query)) category='packaging';
 else if(/ингредиент|закваск|маргарин|жир|шоколад|начинк/u.test(query)) category='ingredients';
 else if(/готов[а-я]* (ед|блюд|продук)|полуфабрикат|перекус/u.test(query)) category='ready';
 query=query.replace(/\b\d+\b/gu,' ').split(/\s+/).filter(w=> !['для','в','во','на','из','и','с','со','нужна','нужны','нужно','нужен','ищу','поставщик','поставщики','доставки','доставка'].includes(w)).join(' ').trim();
 return {query,category,region};
}
export function findSuppliers(list: Supplier[], f: Filters): Supplier[] {
 const terms=words(f.query);
 return list.filter(s=> (!f.category || s.categories.includes(f.category)) && (!f.region || s.regions.some(r=>normalize(r).includes(normalize(f.region)))) && (!terms.length || terms.every(term=>words(s.name+' '+s.description+' '+s.categories.map(c=>({ingredients:'ингредиенты',ready:'готовая продукция',packaging:'упаковка'}[c])).join(' ')).some(w=>w.startsWith(term) || term.startsWith(w)))));
}
export const csvCell = (value: string) => '"'+(/^[\s]*[=+\-@\t\r]/.test(value)?"'":'')+value.replaceAll('"','""')+'"';
export function requestDraft(list: Supplier[], need: string, city: string) {
 return `Здравствуйте!\n\nПросим подготовить коммерческое предложение.\nТовар и объём: ${need.trim() || 'укажем артикулы и объём после подбора ассортимента'}.\nАдрес поставки: ${city.trim() || 'уточним перед расчётом'}.\n\nПодскажите, пожалуйста:\n— цену за единицу и партию с НДС, срок действия предложения;\n— минимальную партию и доступную фасовку;\n— срок, стоимость и условия доставки;\n— условия оплаты;\n— спецификацию и документы на выбранные товары;\n— условия хранения, срок годности и возможность получить образцы.\n\n${list.length ? 'Дополнительно по ассортименту:\n'+list.map(s=>`${s.name}: ${s.clarify}`).join('\n')+'\n\n' : ''}Спасибо!`;
}

export const categories = { ingredients: 'Ингредиенты', ready: 'Готовая продукция', packaging: 'Упаковка' } as const;
export type Category = keyof typeof categories;
export interface Supplier {
 id: string; name: string; short: string; categories: Category[]; description: string;
 regions: string[]; presence: string; phone: string; email?: string; website: string;
 delivery: string; minimum: string; price: string; documents: string; clarify: string;
 sources: { label: string; url: string }[];
}
export const suppliers: Supplier[] = [
 { id: 'puratos', name: 'ПУРАТОС', short: 'П', categories: ['ingredients'],
 description: 'Смеси, закваски, начинки и шоколад для пекарен и кондитерских производств.',
 regions: ['Москва и область', 'Подольск', 'Московская область'], presence: 'Подольск, Московская область · центральный офис и отгрузка',
 phone: '+7 (495) 926-22-24', website: 'https://www.puratos.ru/ru',
 delivery: 'Условия и регионы доставки нужно уточнить.', minimum: 'Не установлено по источникам', price: 'Запросить предложение', documents: 'Запросить документы на выбранный артикул',
 clarify: 'Фасовку, минимальную партию и доставку до вашего адреса.',
 sources: [{ label: 'Ассортимент', url: 'https://www.puratos.ru/ru' }, { label: 'Контакты и отгрузка', url: 'https://www.puratos.ru/ru/contact-us' }] },
 { id: 'metro', name: 'METRO B2B', short: 'M', categories: ['ingredients', 'ready'],
 description: 'Продукты для ресторанов и магазинов; отдельный каталог готовых блюд и полуфабрикатов.',
 regions: ['Москва и область', 'Москва', 'Московская область'], presence: 'Москва · в источнике выбран ТЦ на Ленинградском шоссе',
 phone: '+7 (800) 700-10-22', website: 'https://metro-cc.ru/for-business/b2b',
 delivery: 'B2B-доставка есть; условия зависят от формата бизнеса и адреса.', minimum: 'Уточнить для вашего формата заказа', price: 'По ассортименту и условиям договора', documents: 'Документы на товары уточнять перед заказом',
 clarify: 'Зону доставки, минимальный заказ и цены для вашего бизнеса.',
 sources: [{ label: 'B2B и контакты', url: 'https://metro-cc.ru/for-business/b2b' }, { label: 'Готовая продукция', url: 'https://online.metro-cc.ru/category/gotovye-bljuda-polufabrikaty' }] },
 { id: 'komus', name: 'КОМУС-упаковка', short: 'К', categories: ['packaging'],
 description: 'Пищевая упаковка: контейнеры, ланч-боксы, формы для выпечки и решения для кондитерских.',
 regions: ['Москва и область', 'Москва', 'Московская область', 'Новосибирск', 'Санкт-Петербург'], presence: 'Отделы продаж: Москва и МО, Новосибирск, Санкт-Петербург; есть другие города',
 phone: '+7 (495) 363-90-05', email: 'info-upak@komus.net', website: 'https://www.komus-upakovka.ru/',
 delivery: 'Есть региональные отделы продаж. Доставку согласовать отдельно.', minimum: 'Не установлено по источникам', price: 'Запросить расчёт на тираж', documents: 'На сайте есть раздел документов; проверить нужный артикул',
 clarify: 'Материал, совместимость с продуктом, партию и условия отгрузки.',
 sources: [{ label: 'Каталог и региональные контакты', url: 'https://www.komus-upakovka.ru/' }, { label: 'Приём заявок', url: 'https://www.komus-upakovka.ru/personal/' }] },
 { id: 'vkusvill', name: 'ВкусВилл Бизнес', short: 'В', categories: ['ready'],
 description: 'Готовая еда, перекусы и напитки для бизнеса; есть направление оптовых поставок.',
 regions: [], presence: 'Город и доступность поставки уточнить у B2B-поддержки',
 phone: '+7 (995) 999-28-10', email: 'b2b@vkusvill.ru', website: 'https://vkusvill.ru/b2b/',
 delivery: 'Доступность и формат поставки уточнить по адресу.', minimum: 'Уточнить по каналу закупки', price: 'Запросить B2B-условия', documents: 'ВСД при отгрузке со склада; остальные документы уточнить',
 clarify: 'Срок годности при получении, холодовую цепь и график поставок.',
 sources: [{ label: 'Ассортимент для бизнеса', url: 'https://vkusvill.ru/b2b/' }, { label: 'Оптовое направление', url: 'https://vkusvill.ru/b2b/opt/' }, { label: 'Контакты', url: 'https://vkusvill.ru/contacts/' }, { label: 'Документы и поддержка', url: 'https://vkusvill.ru/support/vkusvill-biznes/' }] },
].sort((a, b) => a.name.localeCompare(b.name, 'ru')) as Supplier[];

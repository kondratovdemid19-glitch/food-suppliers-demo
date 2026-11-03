import catalog from '../data/suppliers.json';
export const categories = { ingredients: 'Ингредиенты', ready: 'Готовая продукция', packaging: 'Упаковка' } as const;
export type Category = keyof typeof categories;
export interface Supplier {
 id: string; name: string; short: string; categories: Category[]; description: string;
 regions: string[]; presence: string; phone: string; email?: string; website: string;
 delivery: string; minimum: string; price: string; documents: string; clarify: string;
 checkedAt: string; sources: { label: string; url: string }[];
}
export const suppliers = (catalog as Supplier[]).sort((a,b)=>a.name.localeCompare(b.name,'ru'));

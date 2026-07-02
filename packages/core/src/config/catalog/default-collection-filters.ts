import { LanguageCode } from '@vendure/common/lib/generated-types';

import { ConfigArgDef } from '../../common/configurable-operation';
import { UserInputError } from '../../common/error/errors';
import { ProductVariant } from '../../entity/product-variant/product-variant.entity';

import { CollectionFilter } from './collection-filter';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { customAlphabet } = require('nanoid');

/**
 * @description
 * Used to created unique key names for DB query parameters, to avoid conflicts if the
 * same filter is applied multiple times.
 */
export function randomSuffix(prefix: string) {
    const nanoid = customAlphabet('123456789abcdefghijklmnopqrstuvwxyz', 6);
    return `${prefix}_${nanoid() as string}`;
}

/**
 * @description
 * Add this to your CollectionFilter `args` object to display the standard UI component
 * for selecting the combination mode when working with multiple filters.
 */
export const combineWithAndArg: ConfigArgDef<'boolean'> = {
    type: 'boolean',
    label: [
        { languageCode: LanguageCode.en, value: 'Combination mode' },
        { languageCode: LanguageCode.de, value: 'Kombinationsmodus' },
        { languageCode: LanguageCode.es, value: 'Modo de combinación' },
        { languageCode: LanguageCode.fr, value: 'Mode de combinaison' },
        { languageCode: LanguageCode.it, value: 'Modalità di combinazione' },
        { languageCode: LanguageCode.nl, value: 'Combinatiemodus' },
        { languageCode: LanguageCode.pt_BR, value: 'Modo de combinação' },
        { languageCode: LanguageCode.pt_PT, value: 'Modo de combinação' },
        { languageCode: LanguageCode.cs, value: 'Režim kombinace' },
        { languageCode: LanguageCode.pl, value: 'Tryb łączenia' },
        { languageCode: LanguageCode.ro, value: 'Mod de combinare' },
        { languageCode: LanguageCode.hr, value: 'Način kombiniranja' },
        { languageCode: LanguageCode.hu, value: 'Kombinációs mód' },
        { languageCode: LanguageCode.nb, value: 'Kombinasjonsmodus' },
        { languageCode: LanguageCode.sv, value: 'Kombinationsläge' },
        { languageCode: LanguageCode.tr, value: 'Birleştirme modu' },
        { languageCode: LanguageCode.uz, value: 'Birlashtirish rejimi' },
        { languageCode: LanguageCode.ru, value: 'Режим комбинирования' },
        { languageCode: LanguageCode.bg, value: 'Режим на комбиниране' },
        { languageCode: LanguageCode.uk, value: 'Режим комбінування' },
        { languageCode: LanguageCode.ar, value: 'وضع الدمج' },
        { languageCode: LanguageCode.fa, value: 'حالت ترکیب' },
        { languageCode: LanguageCode.he, value: 'מצב שילוב' },
        { languageCode: LanguageCode.ja, value: '組み合わせモード' },
        { languageCode: LanguageCode.ne, value: 'संयोजन मोड' },
        { languageCode: LanguageCode.zh_Hans, value: '组合模式' },
        { languageCode: LanguageCode.zh_Hant, value: '組合模式' },
    ],
    description: [
        {
            languageCode: LanguageCode.en,
            // eslint-disable-next-line max-len
            value: 'If this filter is being combined with other filters, do all conditions need to be satisfied (AND), or just one or the other (OR)?',
        },
    ],
    defaultValue: true,
    ui: {
        component: 'combination-mode-form-input',
    },
};

/**
 * Filters for ProductVariants having the given facetValueIds (including parent Product)
 */
export const facetValueCollectionFilter = new CollectionFilter({
    args: {
        facetValueIds: {
            type: 'ID',
            list: true,
            ui: {
                component: 'facet-value-form-input',
            },
            label: [
                { languageCode: LanguageCode.en, value: 'Facet values' },
                { languageCode: LanguageCode.de, value: 'Facettenwerte' },
                { languageCode: LanguageCode.es, value: 'Valores de faceta' },
                { languageCode: LanguageCode.fr, value: 'Valeurs de facette' },
                { languageCode: LanguageCode.it, value: 'Valori di faccetta' },
                { languageCode: LanguageCode.nl, value: 'Facetwaarden' },
                { languageCode: LanguageCode.pt_BR, value: 'Valores de faceta' },
                { languageCode: LanguageCode.pt_PT, value: 'Valores de faceta' },
                { languageCode: LanguageCode.cs, value: 'Hodnoty facet' },
                { languageCode: LanguageCode.pl, value: 'Wartości faset' },
                { languageCode: LanguageCode.ro, value: 'Valori de fasetă' },
                { languageCode: LanguageCode.hr, value: 'Vrijednosti fasete' },
                { languageCode: LanguageCode.hu, value: 'Facetta-értékek' },
                { languageCode: LanguageCode.nb, value: 'Fasettverdier' },
                { languageCode: LanguageCode.sv, value: 'Facettvärden' },
                { languageCode: LanguageCode.tr, value: 'Faset değerleri' },
                { languageCode: LanguageCode.uz, value: 'Faset qiymatlari' },
                { languageCode: LanguageCode.ru, value: 'Значения фасетов' },
                { languageCode: LanguageCode.bg, value: 'Стойности на фасети' },
                { languageCode: LanguageCode.uk, value: 'Значення фасетів' },
                { languageCode: LanguageCode.ar, value: 'قيم الأوجه' },
                { languageCode: LanguageCode.fa, value: 'مقادیر وجه' },
                { languageCode: LanguageCode.he, value: 'ערכי פאסטה' },
                { languageCode: LanguageCode.ja, value: 'ファセット値' },
                { languageCode: LanguageCode.ne, value: 'फ्यासेट मानहरू' },
                { languageCode: LanguageCode.zh_Hans, value: '分面值' },
                { languageCode: LanguageCode.zh_Hant, value: '分面值' },
            ],
        },
        containsAny: {
            type: 'boolean',
            label: [
                { languageCode: LanguageCode.en, value: 'Contains any' },
                { languageCode: LanguageCode.de, value: 'Enthält beliebige' },
                { languageCode: LanguageCode.es, value: 'Contiene alguno' },
                { languageCode: LanguageCode.fr, value: 'Contient au moins une' },
                { languageCode: LanguageCode.it, value: 'Contiene almeno uno' },
                { languageCode: LanguageCode.nl, value: 'Bevat een van' },
                { languageCode: LanguageCode.pt_BR, value: 'Contém qualquer' },
                { languageCode: LanguageCode.pt_PT, value: 'Contém qualquer' },
                { languageCode: LanguageCode.cs, value: 'Obsahuje libovolnou' },
                { languageCode: LanguageCode.pl, value: 'Zawiera dowolną' },
                { languageCode: LanguageCode.ro, value: 'Conține oricare' },
                { languageCode: LanguageCode.hr, value: 'Sadrži bilo koju' },
                { languageCode: LanguageCode.hu, value: 'Bármelyiket tartalmazza' },
                { languageCode: LanguageCode.nb, value: 'Inneholder en av' },
                { languageCode: LanguageCode.sv, value: 'Innehåller någon' },
                { languageCode: LanguageCode.tr, value: 'Herhangi birini içerir' },
                { languageCode: LanguageCode.uz, value: 'Har qandayini oʻz ichiga oladi' },
                { languageCode: LanguageCode.ru, value: 'Содержит любое' },
                { languageCode: LanguageCode.bg, value: 'Съдържа някоя' },
                { languageCode: LanguageCode.uk, value: 'Містить будь-яке' },
                { languageCode: LanguageCode.ar, value: 'يحتوي على أي' },
                { languageCode: LanguageCode.fa, value: 'شامل هر یک' },
                { languageCode: LanguageCode.he, value: 'מכיל כל אחד' },
                { languageCode: LanguageCode.ja, value: 'いずれかを含む' },
                { languageCode: LanguageCode.ne, value: 'कुनै पनि समावेश छ' },
                { languageCode: LanguageCode.zh_Hans, value: '包含任一' },
                { languageCode: LanguageCode.zh_Hant, value: '包含任一' },
            ],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value:
                        'If checked, product variants must have at least one of the selected facet values. ' +
                        'If not checked, the variant must have all selected values.',
                },
            ],
        },
        combineWithAnd: combineWithAndArg,
    },
    code: 'facet-value-filter',
    description: [
        { languageCode: LanguageCode.en, value: 'Filter by facet values' },
        { languageCode: LanguageCode.de, value: 'Nach Facettenwerten filtern' },
        { languageCode: LanguageCode.es, value: 'Filtrar por valores de faceta' },
        { languageCode: LanguageCode.fr, value: 'Filtrer par valeurs de facette' },
        { languageCode: LanguageCode.it, value: 'Filtra per valori di faccetta' },
        { languageCode: LanguageCode.nl, value: 'Filteren op facetwaarden' },
        { languageCode: LanguageCode.pt_BR, value: 'Filtrar por valores de faceta' },
        { languageCode: LanguageCode.pt_PT, value: 'Filtrar por valores de faceta' },
        { languageCode: LanguageCode.cs, value: 'Filtrovat podle hodnot facet' },
        { languageCode: LanguageCode.pl, value: 'Filtruj według wartości faset' },
        { languageCode: LanguageCode.ro, value: 'Filtrează după valori de fasetă' },
        { languageCode: LanguageCode.hr, value: 'Filtriraj po vrijednostima fasete' },
        { languageCode: LanguageCode.hu, value: 'Szűrés facetta-értékek szerint' },
        { languageCode: LanguageCode.nb, value: 'Filtrer etter fasettverdier' },
        { languageCode: LanguageCode.sv, value: 'Filtrera efter facettvärden' },
        { languageCode: LanguageCode.tr, value: 'Faset değerlerine göre filtrele' },
        { languageCode: LanguageCode.uz, value: 'Faset qiymatlari boʻyicha filtrlash' },
        { languageCode: LanguageCode.ru, value: 'Фильтр по значениям фасетов' },
        { languageCode: LanguageCode.bg, value: 'Филтриране по стойности на фасети' },
        { languageCode: LanguageCode.uk, value: 'Фільтрувати за значеннями фасетів' },
        { languageCode: LanguageCode.ar, value: 'التصفية حسب قيم الأوجه' },
        { languageCode: LanguageCode.fa, value: 'فیلتر بر اساس مقادیر وجه' },
        { languageCode: LanguageCode.he, value: 'סינון לפי ערכי פאסטה' },
        { languageCode: LanguageCode.ja, value: 'ファセット値でフィルター' },
        { languageCode: LanguageCode.ne, value: 'फ्यासेट मानहरूद्वारा फिल्टर गर्नुहोस्' },
        { languageCode: LanguageCode.zh_Hans, value: '按分面值筛选' },
        { languageCode: LanguageCode.zh_Hant, value: '按分面值篩選' },
    ],
    apply: (qb, args) => {
        const ids = args.facetValueIds;

        if (ids.length) {
            // uuid IDs can include `-` chars, which we cannot use in a TypeORM key name.
            const safeIdsConcat = ids.join('_').replace(/-/g, '_');
            const idsName = `ids_${safeIdsConcat}`;
            const countName = `count_${safeIdsConcat}`;
            const productFacetValues = qb.connection
                .createQueryBuilder(ProductVariant, 'product_variant')
                .select('product_variant.id', 'variant_id')
                .addSelect('facet_value.id', 'facet_value_id')
                .leftJoin('product_variant.facetValues', 'facet_value')
                .where(`facet_value.id IN (:...${idsName})`);

            const variantFacetValues = qb.connection
                .createQueryBuilder(ProductVariant, 'product_variant')
                .select('product_variant.id', 'variant_id')
                .addSelect('facet_value.id', 'facet_value_id')
                .leftJoin('product_variant.product', 'product')
                .leftJoin('product.facetValues', 'facet_value')
                .where(`facet_value.id IN (:...${idsName})`);

            const union = qb.connection
                .createQueryBuilder()
                .select('union_table.variant_id')
                .from(
                    `(${productFacetValues.getQuery()} UNION ${variantFacetValues.getQuery()})`,
                    'union_table',
                )
                .groupBy('variant_id')
                .having(`COUNT(*) >= :${countName}`);

            const variantIds = qb.connection
                .createQueryBuilder()
                .select('variant_ids_table.variant_id')
                .from(`(${union.getQuery()})`, 'variant_ids_table');

            const clause = `productVariant.id IN (${variantIds.getQuery()})`;
            const params = {
                [idsName]: ids,
                [countName]: args.containsAny ? 1 : ids.length,
            };
            if (args.combineWithAnd !== false) {
                qb.andWhere(clause).setParameters(params);
            } else {
                qb.orWhere(clause).setParameters(params);
            }
        } else {
            // If no facetValueIds are specified, no ProductVariants will be matched.
            if (args.combineWithAnd !== false) {
                qb.andWhere('1 = 0');
            }
        }
        return qb;
    },
});

export const variantNameCollectionFilter = new CollectionFilter({
    args: {
        operator: {
            type: 'string',
            ui: {
                component: 'select-form-input',
                options: [
                    { value: 'startsWith' },
                    { value: 'endsWith' },
                    { value: 'contains' },
                    { value: 'doesNotContain' },
                ],
            },
        },
        term: { type: 'string' },
        combineWithAnd: combineWithAndArg,
    },
    code: 'variant-name-filter',
    description: [
        { languageCode: LanguageCode.en, value: 'Filter by product variant name' },
        { languageCode: LanguageCode.de, value: 'Nach Produktvariantennamen filtern' },
        { languageCode: LanguageCode.es, value: 'Filtrar por nombre de variante de producto' },
        { languageCode: LanguageCode.fr, value: 'Filtrer par nom de variante de produit' },
        { languageCode: LanguageCode.it, value: 'Filtra per nome variante prodotto' },
        { languageCode: LanguageCode.nl, value: 'Filteren op productvariantnaam' },
        { languageCode: LanguageCode.pt_BR, value: 'Filtrar por nome da variante do produto' },
        { languageCode: LanguageCode.pt_PT, value: 'Filtrar por nome da variante de produto' },
        { languageCode: LanguageCode.cs, value: 'Filtrovat podle názvu varianty produktu' },
        { languageCode: LanguageCode.pl, value: 'Filtruj według nazwy wariantu produktu' },
        { languageCode: LanguageCode.ro, value: 'Filtrează după numele variantei de produs' },
        { languageCode: LanguageCode.hr, value: 'Filtriraj po nazivu varijante proizvoda' },
        { languageCode: LanguageCode.hu, value: 'Szűrés termékváltozat neve szerint' },
        { languageCode: LanguageCode.nb, value: 'Filtrer etter produktvariantnavn' },
        { languageCode: LanguageCode.sv, value: 'Filtrera efter produktvariantnamn' },
        { languageCode: LanguageCode.tr, value: 'Ürün varyantı adına göre filtrele' },
        { languageCode: LanguageCode.uz, value: 'Mahsulot varianti nomi boʻyicha filtrlash' },
        { languageCode: LanguageCode.ru, value: 'Фильтр по названию варианта товара' },
        { languageCode: LanguageCode.bg, value: 'Филтриране по име на продуктов вариант' },
        { languageCode: LanguageCode.uk, value: 'Фільтрувати за назвою варіанта товару' },
        { languageCode: LanguageCode.ar, value: 'التصفية حسب اسم متغير المنتج' },
        { languageCode: LanguageCode.fa, value: 'فیلتر بر اساس نام گونهٔ محصول' },
        { languageCode: LanguageCode.he, value: 'סינון לפי שם וריאנט מוצר' },
        { languageCode: LanguageCode.ja, value: '製品バリアント名でフィルター' },
        { languageCode: LanguageCode.ne, value: 'उत्पादन भेरियन्ट नामद्वारा फिल्टर गर्नुहोस्' },
        { languageCode: LanguageCode.zh_Hans, value: '按产品变体名称筛选' },
        { languageCode: LanguageCode.zh_Hant, value: '按產品變體名稱篩選' },
    ],
    apply: (qb, args) => {
        let translationAlias = 'variant_name_filter_translation';
        const termName = randomSuffix('term');
        const translationsJoin = qb.expressionMap.joinAttributes.find(
            ja => ja.entityOrProperty === 'productVariant.translations',
        );
        if (!translationsJoin) {
            qb.leftJoin('productVariant.translations', translationAlias);
        } else {
            translationAlias = translationsJoin.alias.name;
        }
        const LIKE = qb.connection.options.type === 'postgres' ? 'ILIKE' : 'LIKE';
        let clause: string;
        let params: Record<string, string>;
        switch (args.operator) {
            case 'contains':
                clause = `${translationAlias}.name ${LIKE} :${termName}`;
                params = {
                    [termName]: `%${args.term}%`,
                };
                break;
            case 'doesNotContain':
                clause = `${translationAlias}.name NOT ${LIKE} :${termName}`;
                params = {
                    [termName]: `%${args.term}%`,
                };
                break;
            case 'startsWith':
                clause = `${translationAlias}.name ${LIKE} :${termName}`;
                params = {
                    [termName]: `${args.term}%`,
                };
                break;
            case 'endsWith':
                clause = `${translationAlias}.name ${LIKE} :${termName}`;
                params = {
                    [termName]: `%${args.term}`,
                };
                break;
            default:
                throw new UserInputError(`${args.operator} is not a valid operator`);
        }
        if (args.combineWithAnd === false) {
            return qb.orWhere(clause, params);
        } else {
            return qb.andWhere(clause, params);
        }
    },
});

export const variantIdCollectionFilter = new CollectionFilter({
    args: {
        variantIds: {
            type: 'ID',
            list: true,
            label: [
                { languageCode: LanguageCode.en, value: 'Product variants' },
                { languageCode: LanguageCode.de, value: 'Produktvarianten' },
                { languageCode: LanguageCode.es, value: 'Variantes de producto' },
                { languageCode: LanguageCode.fr, value: 'Variantes de produit' },
                { languageCode: LanguageCode.it, value: 'Varianti prodotto' },
                { languageCode: LanguageCode.nl, value: 'Productvarianten' },
                { languageCode: LanguageCode.pt_BR, value: 'Variantes do produto' },
                { languageCode: LanguageCode.pt_PT, value: 'Variantes de produto' },
                { languageCode: LanguageCode.cs, value: 'Varianty produktu' },
                { languageCode: LanguageCode.pl, value: 'Warianty produktu' },
                { languageCode: LanguageCode.ro, value: 'Variante de produs' },
                { languageCode: LanguageCode.hr, value: 'Varijante proizvoda' },
                { languageCode: LanguageCode.hu, value: 'Termékváltozatok' },
                { languageCode: LanguageCode.nb, value: 'Produktvarianter' },
                { languageCode: LanguageCode.sv, value: 'Produktvarianter' },
                { languageCode: LanguageCode.tr, value: 'Ürün varyantları' },
                { languageCode: LanguageCode.uz, value: 'Mahsulot variantlari' },
                { languageCode: LanguageCode.ru, value: 'Варианты товара' },
                { languageCode: LanguageCode.bg, value: 'Продуктови варианти' },
                { languageCode: LanguageCode.uk, value: 'Варіанти товару' },
                { languageCode: LanguageCode.ar, value: 'متغيرات المنتج' },
                { languageCode: LanguageCode.fa, value: 'گونه‌های محصول' },
                { languageCode: LanguageCode.he, value: 'וריאנטים של מוצר' },
                { languageCode: LanguageCode.ja, value: '製品バリアント' },
                { languageCode: LanguageCode.ne, value: 'उत्पादन भेरियन्टहरू' },
                { languageCode: LanguageCode.zh_Hans, value: '产品变体' },
                { languageCode: LanguageCode.zh_Hant, value: '產品變體' },
            ],
            ui: {
                component: 'product-multi-form-input',
                selectionMode: 'variant',
            },
        },
        combineWithAnd: combineWithAndArg,
    },
    code: 'variant-id-filter',
    description: [
        { languageCode: LanguageCode.en, value: 'Manually select product variants' },
        { languageCode: LanguageCode.de, value: 'Produktvarianten manuell auswählen' },
        { languageCode: LanguageCode.es, value: 'Seleccionar manualmente variantes de producto' },
        { languageCode: LanguageCode.fr, value: 'Sélectionner manuellement des variantes de produit' },
        { languageCode: LanguageCode.it, value: 'Seleziona manualmente le varianti prodotto' },
        { languageCode: LanguageCode.nl, value: 'Productvarianten handmatig selecteren' },
        { languageCode: LanguageCode.pt_BR, value: 'Selecionar variantes do produto manualmente' },
        { languageCode: LanguageCode.pt_PT, value: 'Selecionar variantes de produto manualmente' },
        { languageCode: LanguageCode.cs, value: 'Ručně vybrat varianty produktu' },
        { languageCode: LanguageCode.pl, value: 'Ręcznie wybierz warianty produktu' },
        { languageCode: LanguageCode.ro, value: 'Selectează manual variantele de produs' },
        { languageCode: LanguageCode.hr, value: 'Ručno odaberi varijante proizvoda' },
        { languageCode: LanguageCode.hu, value: 'Termékváltozatok kézi kiválasztása' },
        { languageCode: LanguageCode.nb, value: 'Velg produktvarianter manuelt' },
        { languageCode: LanguageCode.sv, value: 'Välj produktvarianter manuellt' },
        { languageCode: LanguageCode.tr, value: 'Ürün varyantlarını manuel seç' },
        { languageCode: LanguageCode.uz, value: 'Mahsulot variantlarini qoʻlda tanlash' },
        { languageCode: LanguageCode.ru, value: 'Выбрать варианты товара вручную' },
        { languageCode: LanguageCode.bg, value: 'Ръчно избиране на продуктови варианти' },
        { languageCode: LanguageCode.uk, value: 'Вибрати варіанти товару вручну' },
        { languageCode: LanguageCode.ar, value: 'تحديد متغيرات المنتج يدويًا' },
        { languageCode: LanguageCode.fa, value: 'انتخاب دستی گونه‌های محصول' },
        { languageCode: LanguageCode.he, value: 'בחירת וריאנטים של מוצר ידנית' },
        { languageCode: LanguageCode.ja, value: '製品バリアントを手動で選択' },
        { languageCode: LanguageCode.ne, value: 'उत्पादन भेरियन्टहरू म्यानुअल रूपमा चयन गर्नुहोस्' },
        { languageCode: LanguageCode.zh_Hans, value: '手动选择产品变体' },
        { languageCode: LanguageCode.zh_Hant, value: '手動選擇產品變體' },
    ],
    apply: (qb, args) => {
        const emptyIds = args.variantIds.length === 0;
        const variantIdsKey = randomSuffix('variantIds');
        const clause = `productVariant.id IN (:...${variantIdsKey})`;
        const params = { [variantIdsKey]: args.variantIds };
        if (args.combineWithAnd === false) {
            if (emptyIds) {
                return qb;
            }
            return qb.orWhere(clause, params);
        } else {
            if (emptyIds) {
                return qb.andWhere('1 = 0');
            }
            return qb.andWhere(clause, params);
        }
    },
});

export const productIdCollectionFilter = new CollectionFilter({
    args: {
        productIds: {
            type: 'ID',
            list: true,
            label: [
                { languageCode: LanguageCode.en, value: 'Products' },
                { languageCode: LanguageCode.de, value: 'Produkte' },
                { languageCode: LanguageCode.es, value: 'Productos' },
                { languageCode: LanguageCode.fr, value: 'Produits' },
                { languageCode: LanguageCode.it, value: 'Prodotti' },
                { languageCode: LanguageCode.nl, value: 'Producten' },
                { languageCode: LanguageCode.pt_BR, value: 'Produtos' },
                { languageCode: LanguageCode.pt_PT, value: 'Produtos' },
                { languageCode: LanguageCode.cs, value: 'Produkty' },
                { languageCode: LanguageCode.pl, value: 'Produkty' },
                { languageCode: LanguageCode.ro, value: 'Produse' },
                { languageCode: LanguageCode.hr, value: 'Proizvodi' },
                { languageCode: LanguageCode.hu, value: 'Termékek' },
                { languageCode: LanguageCode.nb, value: 'Produkter' },
                { languageCode: LanguageCode.sv, value: 'Produkter' },
                { languageCode: LanguageCode.tr, value: 'Ürünler' },
                { languageCode: LanguageCode.uz, value: 'Mahsulotlar' },
                { languageCode: LanguageCode.ru, value: 'Товары' },
                { languageCode: LanguageCode.bg, value: 'Продукти' },
                { languageCode: LanguageCode.uk, value: 'Товари' },
                { languageCode: LanguageCode.ar, value: 'المنتجات' },
                { languageCode: LanguageCode.fa, value: 'محصولات' },
                { languageCode: LanguageCode.he, value: 'מוצרים' },
                { languageCode: LanguageCode.ja, value: '製品' },
                { languageCode: LanguageCode.ne, value: 'उत्पादनहरू' },
                { languageCode: LanguageCode.zh_Hans, value: '产品' },
                { languageCode: LanguageCode.zh_Hant, value: '產品' },
            ],
            ui: {
                component: 'product-multi-form-input',
                selectionMode: 'product',
            },
        },
        combineWithAnd: combineWithAndArg,
    },
    code: 'product-id-filter',
    description: [
        { languageCode: LanguageCode.en, value: 'Manually select products' },
        { languageCode: LanguageCode.de, value: 'Produkte manuell auswählen' },
        { languageCode: LanguageCode.es, value: 'Seleccionar manualmente productos' },
        { languageCode: LanguageCode.fr, value: 'Sélectionner manuellement des produits' },
        { languageCode: LanguageCode.it, value: 'Seleziona manualmente i prodotti' },
        { languageCode: LanguageCode.nl, value: 'Producten handmatig selecteren' },
        { languageCode: LanguageCode.pt_BR, value: 'Selecionar produtos manualmente' },
        { languageCode: LanguageCode.pt_PT, value: 'Selecionar produtos manualmente' },
        { languageCode: LanguageCode.cs, value: 'Ručně vybrat produkty' },
        { languageCode: LanguageCode.pl, value: 'Ręcznie wybierz produkty' },
        { languageCode: LanguageCode.ro, value: 'Selectează manual produsele' },
        { languageCode: LanguageCode.hr, value: 'Ručno odaberi proizvode' },
        { languageCode: LanguageCode.hu, value: 'Termékek kézi kiválasztása' },
        { languageCode: LanguageCode.nb, value: 'Velg produkter manuelt' },
        { languageCode: LanguageCode.sv, value: 'Välj produkter manuellt' },
        { languageCode: LanguageCode.tr, value: 'Ürünleri manuel seç' },
        { languageCode: LanguageCode.uz, value: 'Mahsulotlarni qoʻlda tanlash' },
        { languageCode: LanguageCode.ru, value: 'Выбрать товары вручную' },
        { languageCode: LanguageCode.bg, value: 'Ръчно избиране на продукти' },
        { languageCode: LanguageCode.uk, value: 'Вибрати товари вручну' },
        { languageCode: LanguageCode.ar, value: 'تحديد المنتجات يدويًا' },
        { languageCode: LanguageCode.fa, value: 'انتخاب دستی محصولات' },
        { languageCode: LanguageCode.he, value: 'בחירת מוצרים ידנית' },
        { languageCode: LanguageCode.ja, value: '製品を手動で選択' },
        { languageCode: LanguageCode.ne, value: 'उत्पादनहरू म्यानुअल रूपमा चयन गर्नुहोस्' },
        { languageCode: LanguageCode.zh_Hans, value: '手动选择产品' },
        { languageCode: LanguageCode.zh_Hant, value: '手動選擇產品' },
    ],
    apply: (qb, args) => {
        const emptyIds = args.productIds.length === 0;
        const productIdsKey = randomSuffix('productIds');
        const clause = `productVariant.productId IN (:...${productIdsKey})`;
        const params = { [productIdsKey]: args.productIds };
        if (args.combineWithAnd === false) {
            if (emptyIds) {
                return qb;
            }
            return qb.orWhere(clause, params);
        } else {
            if (emptyIds) {
                return qb.andWhere('1 = 0');
            }
            return qb.andWhere(clause, params);
        }
    },
});

export const defaultCollectionFilters = [
    facetValueCollectionFilter,
    variantNameCollectionFilter,
    variantIdCollectionFilter,
    productIdCollectionFilter,
];

import { graphql, VariablesOf } from 'gql.tada';
import { describe, expect, it } from 'vitest';

import { FieldInfo, getOperationVariablesFields } from '../document-introspection/get-document-structure.js';

import { ConfigurableFieldDef } from './form-engine-types.js';
import {
    convertEmptyStringsToNull,
    isFieldNullable,
    removeEmptyIdFields,
    stripEmptyTranslations,
    stripNullNullableFields,
    transformRelationFields,
} from './utils.js';

const createProductDocument = graphql(`
    mutation CreateProduct($input: CreateProductInput!) {
        createProduct(input: $input) {
            id
        }
    }
`);

type CreateProductInput = VariablesOf<typeof createProductDocument>;

const updateProductDocument = graphql(`
    mutation UpdateProduct($input: UpdateProductInput!) {
        updateProduct(input: $input) {
            id
        }
    }
`);

type UpdateProductInput = VariablesOf<typeof updateProductDocument>;

describe('removeEmptyIdFields', () => {
    it('should remove empty translation id field', () => {
        const values: CreateProductInput = {
            input: { translations: [{ id: '', languageCode: 'en' }] },
        };
        const fields = getOperationVariablesFields(createProductDocument);
        const result = removeEmptyIdFields(values, fields);

        expect(result).toEqual({ input: { translations: [{ languageCode: 'en' }] } });
    });

    it('should remove empty featuredAsset id field', () => {
        const values: CreateProductInput = {
            input: { featuredAssetId: '', translations: [] },
        };
        const fields = getOperationVariablesFields(createProductDocument);
        const result = removeEmptyIdFields(values, fields);
        expect(result).toEqual({ input: { translations: [] } });
    });
});

// https://github.com/vendurehq/vendure/issues/4885 (OSS-579)
// The form seeds a translation row per configured language; submitting the unfilled ones
// persists empty translation rows that break language fallback. stripEmptyTranslations
// drops the seeded-but-empty entries (no id, all fields empty) before submit.
describe('stripEmptyTranslations', () => {
    const fields = () => getOperationVariablesFields(createProductDocument);

    it('drops a seeded empty translation and keeps the filled ones', () => {
        const values: CreateProductInput = {
            input: {
                translations: [
                    { languageCode: 'en', name: 'Test product', slug: 'test-product', description: '' },
                    { languageCode: 'pl', name: '', slug: '', description: '' },
                ],
            },
        };
        const result = stripEmptyTranslations(values, fields());
        expect(result.input.translations).toEqual([
            { languageCode: 'en', name: 'Test product', slug: 'test-product', description: '' },
        ]);
    });

    it('keeps an existing translation (with an id) even if all fields are empty', () => {
        const values: any = {
            input: {
                translations: [{ id: '42', languageCode: 'pl', name: '', slug: '', description: '' }],
            },
        };
        const result = stripEmptyTranslations(values, fields());
        expect(result.input.translations).toEqual([
            { id: '42', languageCode: 'pl', name: '', slug: '', description: '' },
        ]);
    });

    it('keeps a translation where at least one field is filled', () => {
        const values: CreateProductInput = {
            input: {
                translations: [{ languageCode: 'pl', name: '', slug: 'polski-slug', description: '' }],
            },
        };
        const result = stripEmptyTranslations(values, fields());
        expect(result.input.translations).toEqual([
            { languageCode: 'pl', name: '', slug: 'polski-slug', description: '' },
        ]);
    });

    it('leaves values without empty translations unchanged', () => {
        const values: CreateProductInput = {
            input: {
                translations: [
                    { languageCode: 'en', name: 'Test product', slug: 'test-product', description: '' },
                ],
            },
        };
        const result = stripEmptyTranslations(values, fields());
        expect(result).toEqual(values);
    });

    // If every row is seeded-empty, stripping them all would submit `translations: []`. A blank
    // create form is reachable (a non-nullable `String` maps to a bare `z.string()`), so keep the
    // rows and let validation surface the empty required fields instead of silently sending none.
    it('keeps all rows when every one is a seeded empty translation', () => {
        const values: CreateProductInput = {
            input: {
                translations: [
                    { languageCode: 'en', name: '', slug: '', description: '' },
                    { languageCode: 'pl', name: '', slug: '', description: '' },
                ],
            },
        };
        const result = stripEmptyTranslations(values, fields());
        expect(result.input.translations).toEqual([
            { languageCode: 'en', name: '', slug: '', description: '' },
            { languageCode: 'pl', name: '', slug: '', description: '' },
        ]);
    });

    // The actual #4885 scenario: editing an entity that already has one persisted translation
    // while the form seeded an empty row for a second language. The persisted row (with an id) is
    // kept, the seeded-empty one dropped.
    it('on update, keeps the persisted translation and drops the seeded empty row', () => {
        const values: UpdateProductInput = {
            input: {
                id: '1',
                translations: [
                    { id: '10', languageCode: 'en', name: 'Laptop', slug: 'laptop', description: '' },
                    { languageCode: 'pl', name: '', slug: '', description: '' },
                ],
            },
        };
        const result = stripEmptyTranslations(values, getOperationVariablesFields(updateProductDocument));
        expect(result.input.translations).toEqual([
            { id: '10', languageCode: 'en', name: 'Laptop', slug: 'laptop', description: '' },
        ]);
    });

    // The recursive empty-check descends into an object field: an otherwise-empty row carrying
    // only `customFields: {}` is still seeded-empty and gets dropped alongside a filled sibling.
    it('treats a row with only an empty customFields object as seeded-empty', () => {
        const values: any = {
            input: {
                translations: [
                    {
                        languageCode: 'en',
                        name: 'Test product',
                        slug: 'test-product',
                        description: '',
                    },
                    { languageCode: 'pl', name: '', slug: '', description: '', customFields: {} },
                ],
            },
        };
        const result = stripEmptyTranslations(values, fields());
        expect(result.input.translations).toEqual([
            { languageCode: 'en', name: 'Test product', slug: 'test-product', description: '' },
        ]);
    });

    it('does not mutate the input', () => {
        const values: CreateProductInput = {
            input: {
                translations: [
                    { languageCode: 'en', name: 'Test product', slug: 'test-product', description: '' },
                    { languageCode: 'pl', name: '', slug: '', description: '' },
                ],
            },
        };
        const snapshot = structuredClone(values);
        stripEmptyTranslations(values, fields());
        expect(values).toEqual(snapshot);
    });

    it('returns null input unchanged', () => {
        expect(stripEmptyTranslations(null as any, fields())).toBeNull();
    });
});

describe('transformRelationFields', () => {
    const createFieldsWithListRelation = (): FieldInfo[] => [
        {
            name: 'customFields',
            type: 'CustomFields',
            nullable: true,
            list: false,
            isPaginatedList: false,
            isScalar: false,
            typeInfo: [
                {
                    name: 'featuredProductsIds',
                    type: 'ID',
                    nullable: true,
                    list: true,
                    isPaginatedList: false,
                    isScalar: true,
                },
            ],
        },
    ];

    const createFieldsWithSingleRelation = (): FieldInfo[] => [
        {
            name: 'customFields',
            type: 'CustomFields',
            nullable: true,
            list: false,
            isPaginatedList: false,
            isScalar: false,
            typeInfo: [
                {
                    name: 'featuredProductId',
                    type: 'ID',
                    nullable: true,
                    list: false,
                    isPaginatedList: false,
                    isScalar: true,
                },
            ],
        },
    ];

    it('should extract IDs from list relation and delete original field', () => {
        const entity = {
            customFields: {
                featuredProducts: [
                    { id: '1', name: 'Product 1' },
                    { id: '2', name: 'Product 2' },
                ],
            },
        };
        const result = transformRelationFields(createFieldsWithListRelation(), entity);

        expect(result.customFields).toEqual({ featuredProductsIds: ['1', '2'] });
        expect(result.customFields).not.toHaveProperty('featuredProducts');
    });

    it('should handle empty array for clearing list relations', () => {
        const entity = { customFields: { featuredProducts: [] } };
        const result = transformRelationFields(createFieldsWithListRelation(), entity);

        expect(result.customFields).toEqual({ featuredProductsIds: [] });
    });

    it('should handle undefined list relation by not setting the field', () => {
        const undefinedResult = transformRelationFields(createFieldsWithListRelation(), { customFields: {} });

        expect(undefinedResult.customFields).not.toHaveProperty('featuredProductsIds');
    });

    it('should pass null through when list relation is explicitly cleared', () => {
        // Simulates clearing a relation: the form engine receives null from onChange,
        // which the static types don't model
        const nullResult = transformRelationFields(createFieldsWithListRelation(), {
            customFields: { featuredProducts: null } as any,
        });

        expect(nullResult.customFields.featuredProductsIds).toBeNull();
        expect(nullResult.customFields).not.toHaveProperty('featuredProducts');
    });

    it('should pass null through when single relation is explicitly cleared', () => {
        // Simulates clearing a relation: the form engine receives null from onChange,
        // which the static types don't model
        const result = transformRelationFields(createFieldsWithSingleRelation(), {
            customFields: { featuredProduct: null } as any,
        });

        expect(result.customFields.featuredProductId).toBeNull();
        expect(result.customFields).not.toHaveProperty('featuredProduct');
    });

    it('should extract ID from single relation and delete original field', () => {
        const entity = { customFields: { featuredProduct: { id: '1', name: 'Product 1' } } };
        const result = transformRelationFields(createFieldsWithSingleRelation(), entity);

        expect(result.customFields).toEqual({ featuredProductId: '1' });
        expect(result.customFields).not.toHaveProperty('featuredProduct');
    });

    it('should not mutate the original entity', () => {
        const entity = { customFields: { featuredProducts: [{ id: '1' }] } };
        const result = transformRelationFields(createFieldsWithListRelation(), entity);

        expect(entity.customFields.featuredProducts).toEqual([{ id: '1' }]);
        expect(result).not.toBe(entity);
    });

    it('should preserve other custom fields while transforming relations', () => {
        const fields: FieldInfo[] = [
            {
                name: 'customFields',
                type: 'CustomFields',
                nullable: true,
                list: false,
                isPaginatedList: false,
                isScalar: false,
                typeInfo: [
                    {
                        name: 'featuredProductsIds',
                        type: 'ID',
                        nullable: true,
                        list: true,
                        isPaginatedList: false,
                        isScalar: true,
                    },
                    {
                        name: 'notes',
                        type: 'String',
                        nullable: true,
                        list: false,
                        isPaginatedList: false,
                        isScalar: true,
                    },
                ],
            },
        ];
        const entity = { customFields: { featuredProducts: [{ id: '1' }], notes: 'Some notes' } };
        const result = transformRelationFields(fields, entity);

        expect(result.customFields).toEqual({ featuredProductsIds: ['1'], notes: 'Some notes' });
    });

    it('should handle customFields nested inside input (draft order case)', () => {
        const fields: FieldInfo[] = [
            {
                name: 'orderId',
                type: 'ID',
                nullable: false,
                list: false,
                isPaginatedList: false,
                isScalar: true,
            },
            {
                name: 'input',
                type: 'UpdateOrderInput',
                nullable: false,
                list: false,
                isPaginatedList: false,
                isScalar: false,
                typeInfo: [
                    {
                        name: 'id',
                        type: 'ID',
                        nullable: false,
                        list: false,
                        isPaginatedList: false,
                        isScalar: true,
                    },
                    {
                        name: 'customFields',
                        type: 'CustomFields',
                        nullable: true,
                        list: false,
                        isPaginatedList: false,
                        isScalar: false,
                        typeInfo: [
                            {
                                name: 'featuredProductId',
                                type: 'ID',
                                nullable: true,
                                list: false,
                                isPaginatedList: false,
                                isScalar: true,
                            },
                        ],
                    },
                ],
            },
        ];
        const entity = {
            orderId: 'order-1',
            input: {
                id: 'order-1',
                customFields: {
                    featuredProduct: { id: '3', name: 'Product 3' },
                },
            },
        };
        const result = transformRelationFields(fields, entity);

        expect(result.input.customFields).toEqual({ featuredProductId: '3' });
        expect(result.input.customFields).not.toHaveProperty('featuredProduct');
        expect(result.orderId).toBe('order-1');
    });

    it('should handle nested list relation customFields inside input', () => {
        const fields: FieldInfo[] = [
            {
                name: 'input',
                type: 'UpdateOrderInput',
                nullable: false,
                list: false,
                isPaginatedList: false,
                isScalar: false,
                typeInfo: [
                    {
                        name: 'customFields',
                        type: 'CustomFields',
                        nullable: true,
                        list: false,
                        isPaginatedList: false,
                        isScalar: false,
                        typeInfo: [
                            {
                                name: 'featuredProductsIds',
                                type: 'ID',
                                nullable: true,
                                list: true,
                                isPaginatedList: false,
                                isScalar: true,
                            },
                        ],
                    },
                ],
            },
        ];
        const entity = {
            input: {
                customFields: {
                    featuredProducts: [
                        { id: '1', name: 'Product 1' },
                        { id: '2', name: 'Product 2' },
                    ],
                },
            },
        };
        const result = transformRelationFields(fields, entity);

        expect(result.input.customFields).toEqual({ featuredProductsIds: ['1', '2'] });
        expect(result.input.customFields).not.toHaveProperty('featuredProducts');
    });

    it('should not mutate the original entity when processing nested customFields', () => {
        const fields: FieldInfo[] = [
            {
                name: 'input',
                type: 'UpdateOrderInput',
                nullable: false,
                list: false,
                isPaginatedList: false,
                isScalar: false,
                typeInfo: [
                    {
                        name: 'customFields',
                        type: 'CustomFields',
                        nullable: true,
                        list: false,
                        isPaginatedList: false,
                        isScalar: false,
                        typeInfo: [
                            {
                                name: 'featuredProductId',
                                type: 'ID',
                                nullable: true,
                                list: false,
                                isPaginatedList: false,
                                isScalar: true,
                            },
                        ],
                    },
                ],
            },
        ];
        const entity = {
            input: {
                customFields: {
                    featuredProduct: { id: '1', name: 'Product 1' },
                },
            },
        };
        const result = transformRelationFields(fields, entity);

        expect(entity.input.customFields.featuredProduct).toEqual({ id: '1', name: 'Product 1' });
        expect(result).not.toBe(entity);
        expect(result.input).not.toBe(entity.input);
    });

    it('should handle array fields containing customFields (e.g. translations)', () => {
        const fields: FieldInfo[] = [
            {
                name: 'lines',
                type: 'OrderLineInput',
                nullable: false,
                list: true,
                isPaginatedList: false,
                isScalar: false,
                typeInfo: [
                    {
                        name: 'customFields',
                        type: 'CustomFields',
                        nullable: true,
                        list: false,
                        isPaginatedList: false,
                        isScalar: false,
                        typeInfo: [
                            {
                                name: 'featuredProductId',
                                type: 'ID',
                                nullable: true,
                                list: false,
                                isPaginatedList: false,
                                isScalar: true,
                            },
                        ],
                    },
                ],
            },
        ];
        const entity = {
            lines: [
                { customFields: { featuredProduct: { id: '1', name: 'Product 1' } } },
                { customFields: { featuredProduct: { id: '2', name: 'Product 2' } } },
            ],
        };
        const result = transformRelationFields(fields, entity);

        expect(result.lines[0].customFields).toEqual({ featuredProductId: '1' });
        expect(result.lines[0].customFields).not.toHaveProperty('featuredProduct');
        expect(result.lines[1].customFields).toEqual({ featuredProductId: '2' });
        expect(result.lines[1].customFields).not.toHaveProperty('featuredProduct');
    });

    it('should not mutate original array items when processing array fields', () => {
        const fields: FieldInfo[] = [
            {
                name: 'lines',
                type: 'OrderLineInput',
                nullable: false,
                list: true,
                isPaginatedList: false,
                isScalar: false,
                typeInfo: [
                    {
                        name: 'customFields',
                        type: 'CustomFields',
                        nullable: true,
                        list: false,
                        isPaginatedList: false,
                        isScalar: false,
                        typeInfo: [
                            {
                                name: 'featuredProductId',
                                type: 'ID',
                                nullable: true,
                                list: false,
                                isPaginatedList: false,
                                isScalar: true,
                            },
                        ],
                    },
                ],
            },
        ];
        const entity = {
            lines: [{ customFields: { featuredProduct: { id: '1', name: 'Product 1' } } }],
        };
        transformRelationFields(fields, entity);

        expect(entity.lines[0].customFields.featuredProduct).toEqual({ id: '1', name: 'Product 1' });
    });
});

describe('convertEmptyStringsToNull', () => {
    it('should not throw when called with null values', () => {
        const fields: FieldInfo[] = [
            {
                name: 'customFields',
                type: 'CustomFieldsInput',
                nullable: true,
                list: false,
                isPaginatedList: false,
                isScalar: false,
            },
        ];
        expect(() => convertEmptyStringsToNull(null as any, fields)).not.toThrow();
        expect(convertEmptyStringsToNull(null as any, fields)).toBeNull();
    });

    it('should preserve empty object for nullable non-scalar fields', () => {
        const fields: FieldInfo[] = [
            {
                name: 'customFields',
                type: 'CustomFieldsInput',
                nullable: true,
                list: false,
                isPaginatedList: false,
                isScalar: false,
            },
        ];
        const values = { customFields: {} };
        const result = convertEmptyStringsToNull(values, fields);
        expect(result.customFields).toEqual({});
    });

    it('should convert empty string to null for nullable DateTime fields', () => {
        const fields: FieldInfo[] = [
            {
                name: 'releaseDate',
                type: 'DateTime',
                nullable: true,
                list: false,
                isPaginatedList: false,
                isScalar: true,
            },
        ];
        const values = { releaseDate: '' };
        const result = convertEmptyStringsToNull(values, fields);
        expect(result.releaseDate).toBeNull();
    });

    it('should NOT convert empty string to null for nullable String fields', () => {
        const fields: FieldInfo[] = [
            {
                name: 'description',
                type: 'String',
                nullable: true,
                list: false,
                isPaginatedList: false,
                isScalar: true,
            },
        ];
        const values = { description: '' };
        const result = convertEmptyStringsToNull(values, fields);
        expect(result.description).toBe('');
    });

    it('should convert empty strings to null in nested array objects', () => {
        const fields: FieldInfo[] = [
            {
                name: 'translations',
                type: 'TranslationInput',
                nullable: false,
                list: true,
                isPaginatedList: false,
                isScalar: false,
                typeInfo: [
                    {
                        name: 'releaseDate',
                        type: 'DateTime',
                        nullable: true,
                        list: false,
                        isPaginatedList: false,
                        isScalar: true,
                    },
                    {
                        name: 'name',
                        type: 'String',
                        nullable: true,
                        list: false,
                        isPaginatedList: false,
                        isScalar: true,
                    },
                ],
            },
        ];
        const values = {
            translations: [{ releaseDate: '', name: '' }],
        };
        const result = convertEmptyStringsToNull(values, fields);
        expect(result.translations[0].releaseDate).toBeNull();
        expect(result.translations[0].name).toBe('');
    });

    it('should not mutate the original values', () => {
        const fields: FieldInfo[] = [
            {
                name: 'releaseDate',
                type: 'DateTime',
                nullable: true,
                list: false,
                isPaginatedList: false,
                isScalar: true,
            },
        ];
        const values = { releaseDate: '' };
        convertEmptyStringsToNull(values, fields);
        expect(values.releaseDate).toBe('');
    });
});

describe('stripNullNullableFields', () => {
    it('should strip null from nullable scalar fields', () => {
        const fields: FieldInfo[] = [
            {
                name: 'outOfStockThreshold',
                type: 'Int',
                nullable: true,
                list: false,
                isPaginatedList: false,
                isScalar: true,
            },
            {
                name: 'weight',
                type: 'Float',
                nullable: true,
                list: false,
                isPaginatedList: false,
                isScalar: true,
            },
            {
                name: 'releaseDate',
                type: 'DateTime',
                nullable: true,
                list: false,
                isPaginatedList: false,
                isScalar: true,
            },
        ];
        const values = { outOfStockThreshold: null, weight: null, releaseDate: null };
        const result = stripNullNullableFields(values, fields);
        expect(result).toEqual({});
    });

    it('should preserve non-null values for nullable fields', () => {
        const fields: FieldInfo[] = [
            {
                name: 'outOfStockThreshold',
                type: 'Int',
                nullable: true,
                list: false,
                isPaginatedList: false,
                isScalar: true,
            },
            {
                name: 'weight',
                type: 'Float',
                nullable: true,
                list: false,
                isPaginatedList: false,
                isScalar: true,
            },
        ];
        const values = { outOfStockThreshold: 5, weight: null };
        const result = stripNullNullableFields(values, fields);
        expect(result).toEqual({ outOfStockThreshold: 5 });
    });

    it('should preserve null for non-nullable fields', () => {
        const fields: FieldInfo[] = [
            {
                name: 'code',
                type: 'String',
                nullable: false,
                list: false,
                isPaginatedList: false,
                isScalar: true,
            },
        ];
        const values = { code: null };
        const result = stripNullNullableFields(values, fields);
        expect(result).toEqual({ code: null });
    });

    it('should handle nested objects with nullable fields', () => {
        const fields: FieldInfo[] = [
            {
                name: 'translations',
                type: 'TranslationInput',
                nullable: false,
                list: true,
                isPaginatedList: false,
                isScalar: false,
                typeInfo: [
                    {
                        name: 'name',
                        type: 'String',
                        nullable: false,
                        list: false,
                        isPaginatedList: false,
                        isScalar: true,
                    },
                    {
                        name: 'description',
                        type: 'String',
                        nullable: true,
                        list: false,
                        isPaginatedList: false,
                        isScalar: true,
                    },
                ],
            },
        ];
        const values = {
            translations: [{ name: 'Test', description: null }],
        };
        const result = stripNullNullableFields(values, fields);
        expect(result).toEqual({ translations: [{ name: 'Test' }] });
    });

    it('should handle null input gracefully', () => {
        const fields: FieldInfo[] = [];
        expect(stripNullNullableFields(null as any, fields)).toBeNull();
    });

    it('should not mutate the original values', () => {
        const fields: FieldInfo[] = [
            {
                name: 'threshold',
                type: 'Int',
                nullable: true,
                list: false,
                isPaginatedList: false,
                isScalar: true,
            },
        ];
        const values = { threshold: null };
        const result = stripNullNullableFields(values, fields);
        expect(values.threshold).toBeNull();
        expect(result).toEqual({});
    });
});

describe('isFieldNullable', () => {
    it('should return true for nullable custom fields', () => {
        expect(
            isFieldNullable({
                name: 'featureType',
                type: 'string',
                nullable: true,
                readonly: false,
                list: false,
            } as ConfigurableFieldDef),
        ).toBe(true);
    });

    it('should return false for non-nullable custom fields', () => {
        expect(
            isFieldNullable({
                name: 'priority',
                type: 'string',
                nullable: false,
                readonly: false,
                list: false,
            } as ConfigurableFieldDef),
        ).toBe(false);
    });

    it('should return true for nullable struct sub-fields', () => {
        expect(
            isFieldNullable({
                name: 'kind',
                type: 'string',
                nullable: true,
                options: [{ value: 'a' }],
            } as ConfigurableFieldDef),
        ).toBe(true);
    });

    it('should return false for configurable operation args', () => {
        expect(
            isFieldNullable({
                name: 'arg',
                type: 'string',
                list: false,
                ui: { options: [{ value: 'a' }] },
            } as ConfigurableFieldDef),
        ).toBe(false);
    });
});

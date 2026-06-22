/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DeletionResult, LanguageCode } from '@vendure/common/lib/generated-types';
import {
    EventBus,
    Province,
    ProvinceEvent,
    ProvinceService,
    RequestContext,
    RequestContextService,
} from '@vendure/core';
import { createTestEnvironment } from '@vendure/testing';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { initialData } from '../../../e2e-common/e2e-initial-data';
import { TEST_SETUP_TIMEOUT_MS, testConfig } from '../../../e2e-common/test-config';

// https://github.com/vendurehq/vendure/issues/4792
// `Province` (entity) and `ProvinceService` are documented as public API but were not
// exported from `@vendure/core`, and `ProvinceService` was never registered as a provider.
// This suite fails on master: the `@vendure/core` import resolves `Province` /
// `ProvinceService` to `undefined`, so `app.get(ProvinceService)` cannot be injected.
describe('Province entity & ProvinceService (#4792)', () => {
    const { server } = createTestEnvironment(testConfig());
    let provinceService: ProvinceService;
    let ctx: RequestContext;

    beforeAll(async () => {
        await server.init({
            initialData,
            productsCsvPath: path.join(__dirname, 'fixtures/e2e-products-minimal.csv'),
            customerCount: 1,
        });
        provinceService = server.app.get(ProvinceService);
        ctx = await server.app.get(RequestContextService).create({ apiType: 'admin' });
    }, TEST_SETUP_TIMEOUT_MS);

    afterAll(async () => {
        await server.destroy();
    });

    it('exports Province, ProvinceService and ProvinceEvent from @vendure/core', () => {
        expect(typeof Province).toBe('function');
        expect(typeof ProvinceService).toBe('function');
        expect(typeof ProvinceEvent).toBe('function');
    });

    it('registers ProvinceService as an injectable provider', () => {
        expect(provinceService).toBeInstanceOf(ProvinceService);
    });

    it('can create, find, list and delete a Province via the service', async () => {
        const eventBus = server.app.get(EventBus);
        const published: ProvinceEvent[] = [];
        const subscription = eventBus.ofType(ProvinceEvent).subscribe(e => published.push(e));

        const created = await provinceService.create(ctx, {
            code: 'US-CA',
            enabled: true,
            translations: [{ languageCode: LanguageCode.en, name: 'California' }],
        });
        expect(created.code).toBe('US-CA');
        expect(created.name).toBe('California');
        expect(created.type).toBe('province');

        const found = await provinceService.findOne(ctx, created.id);
        expect(found?.name).toBe('California');

        const list = await provinceService.findAll(ctx, { filter: { code: { eq: 'US-CA' } } });
        expect(list.items.map(p => p.code)).toContain('US-CA');

        const deletion = await provinceService.delete(ctx, created.id);
        expect(deletion.result).toBe(DeletionResult.DELETED);
        expect(await provinceService.findOne(ctx, created.id)).toBeUndefined();

        subscription.unsubscribe();
        expect(published.map(e => e.type)).toEqual(['created', 'deleted']);
    });
});

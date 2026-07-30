import { getMetadataArgsStorage } from 'typeorm';
import { afterEach, describe, expect, it } from 'vitest';

import { resetConfig, setConfig } from './config-helpers';
import { ConfigService } from './config.service';
// Registers the core entities' metadata (side effect only).
import '../entity/entities';

/**
 * OSS-654: the ConfigService.customFields getter seeds an empty array for every registered entity
 * that supports custom fields but isn't explicitly configured. It used to detect translation
 * entities (which must be excluded) by a `*Translation` name suffix plus a `languageCode` column;
 * it now delegates to the shared, relation-based `getEntityNamesWithCustomFields`, so it can no
 * longer diverge from the bootstrap-time auto-init.
 */
describe('ConfigService.customFields', () => {
    afterEach(() => {
        resetConfig();
    });

    it('seeds supporting entities and excludes translation entities via relation-based detection', async () => {
        const storage = getMetadataArgsStorage();
        class Oss654Base {}
        // A translation target whose name does NOT end in "Translation" — the old name+suffix
        // heuristic would have wrongly seeded it; the relation-based detection excludes it.
        class Oss654Locale {}
        const baseEmbedded = {
            target: Oss654Base,
            propertyName: 'customFields',
            prefix: undefined,
            type: () => Oss654Base,
        } as any;
        const localeEmbedded = {
            target: Oss654Locale,
            propertyName: 'customFields',
            prefix: undefined,
            type: () => Oss654Locale,
        } as any;
        const translationsRelation = {
            target: Oss654Base,
            propertyName: 'translations',
            relationType: 'one-to-many',
            type: () => Oss654Locale,
            isLazy: false,
            options: {},
        } as any;
        storage.embeddeds.push(baseEmbedded, localeEmbedded);
        storage.relations.push(translationsRelation);
        try {
            await setConfig({
                dbConnectionOptions: { type: 'sqljs', entities: [Oss654Base, Oss654Locale] } as any,
                customFields: {},
            });
            const configService = new ConfigService();
            const customFields = configService.customFields;
            // the base entity supports custom fields → seeded
            expect(customFields.Oss654Base).toEqual([]);
            // the translation target is excluded despite not ending in "Translation"
            expect((customFields as any).Oss654Locale).toBeUndefined();
        } finally {
            storage.embeddeds = storage.embeddeds.filter(
                e => e !== baseEmbedded && e !== localeEmbedded,
            );
            storage.relations = storage.relations.filter(r => r !== translationsRelation);
        }
    });

    it('does not overwrite an explicitly-configured entity', async () => {
        await setConfig({
            dbConnectionOptions: { type: 'sqljs', entities: [] } as any,
            customFields: { Product: [{ name: 'foo', type: 'string' }] },
        });
        const configService = new ConfigService();
        expect(configService.customFields.Product).toEqual([{ name: 'foo', type: 'string' }]);
    });
});

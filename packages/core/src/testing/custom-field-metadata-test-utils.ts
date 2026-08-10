import { Type } from '@vendure/common/lib/shared-types';
import { getMetadataArgsStorage } from 'typeorm';

/**
 * Registers custom-field-related TypeORM metadata directly in the process-global metadata storage,
 * so specs can exercise the relation-based translation-entity detection in
 * `getEntityNamesWithCustomFields`. Declaring throwaway `@Entity` classes instead would pollute
 * the metadata for every other test in the process.
 *
 * Set `baseHasCustomFields` to push a `customFields` embedded on the `base`. Pass a
 * `translationTarget` to also push a `customFields` embedded on that target and a `translations`
 * relation from `base` to it. That relation is the signal `getEntityNamesWithCustomFields` uses to
 * exclude translation entities.
 *
 * `relationTarget` is the relation's target reference. It accepts the three shapes TypeORM allows:
 * a constructor closure, a bare string name, or a closure returning a string. Omit it for a bare
 * relation with no target.
 *
 * Returns a cleanup fn that removes exactly what it pushed, matched by reference, so that
 * interleaved registrations across tests unwind cleanly regardless of order. Shared by
 * `bootstrap.spec.ts` and `config.service.spec.ts` so both use one teardown implementation over
 * the shared metadata storage.
 */
export function registerCustomFieldEntityMetadata(options: {
    base: Type<any> | { name: string };
    baseHasCustomFields?: boolean;
    translationTarget?: Type<any> | { name: string };
    relationTarget?: unknown;
}): () => void {
    const storage = getMetadataArgsStorage();
    const pushedEmbeddeds: unknown[] = [];
    const pushedRelations: unknown[] = [];

    const pushEmbedded = (target: Type<any> | { name: string }) => {
        const embedded = { target, propertyName: 'customFields', prefix: undefined, type: () => Object };
        storage.embeddeds.push(embedded as any);
        pushedEmbeddeds.push(embedded);
    };

    if (options.baseHasCustomFields) {
        pushEmbedded(options.base);
    }
    if (options.translationTarget) {
        pushEmbedded(options.translationTarget);
        const relation = {
            target: options.base,
            propertyName: 'translations',
            relationType: 'one-to-many',
            type: options.relationTarget,
            isLazy: false,
            options: {},
        };
        storage.relations.push(relation as any);
        pushedRelations.push(relation);
    }

    return () => {
        for (const embedded of pushedEmbeddeds) {
            const index = storage.embeddeds.indexOf(embedded as any);
            if (index !== -1) {
                storage.embeddeds.splice(index, 1);
            }
        }
        for (const relation of pushedRelations) {
            const index = storage.relations.indexOf(relation as any);
            if (index !== -1) {
                storage.relations.splice(index, 1);
            }
        }
    };
}

import { Type } from '@vendure/common/lib/shared-types';
import { getMetadataArgsStorage } from 'typeorm';

/**
 * Registers custom-field-related TypeORM metadata directly in the process-global metadata storage,
 * so specs can exercise the relation-based translation-entity detection (used by
 * `getEntityNamesWithCustomFields`) without declaring throwaway `@Entity` classes that would
 * pollute the metadata for every other test in the process.
 *
 * Pushes an optional `customFields` embedded on the `base` and/or `translationTarget`, and — when a
 * `translationTarget` is given — a `translations` relation from `base` to it (the signal by which
 * translation entities are detected and excluded). The relation `type` deliberately accepts the
 * three shapes TypeORM allows (a constructor closure, a bare string name, or a closure returning a
 * string) so callers can cover each.
 *
 * Returns a cleanup fn that removes exactly what it pushed, matched by reference (not by `pop()`),
 * so that interleaved registrations across tests unwind cleanly regardless of order. Shared by
 * `bootstrap.spec.ts` and `config.service.spec.ts` so neither re-rolls its own teardown idiom over
 * the shared metadata storage.
 */
export function registerCustomFieldEntityMetadata(options: {
    base: Type<any> | { name: string };
    baseHasCustomFields?: boolean;
    translationTarget?: Type<any> | { name: string };
    relationType?: unknown;
    translationHasCustomFields?: boolean;
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
        if (options.translationHasCustomFields ?? true) {
            pushEmbedded(options.translationTarget);
        }
        const relation = {
            target: options.base,
            propertyName: 'translations',
            relationType: 'one-to-many',
            type: options.relationType,
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

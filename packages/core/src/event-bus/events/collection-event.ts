import { CreateCollectionInput, UpdateCollectionInput } from '@vendure/common/lib/generated-types';
import { ID } from '@vendure/common/lib/shared-types';

import { RequestContext } from '../../api';
import { Collection } from '../../entity';
import { VendureEntityEvent } from '../vendure-entity-event';

type CollectionInputTypes = CreateCollectionInput | UpdateCollectionInput | ID;

/**
 * @description
 * This event is fired whenever a {@link Collection} is added, updated or deleted.
 *
 * @docsCategory events
 * @docsPage Event Types
 * @since 1.4
 */
export class CollectionEvent extends VendureEntityEvent<Collection, CollectionInputTypes> {
    constructor(
        ctx: RequestContext,
        entity: Collection,
        type: 'created' | 'updated' | 'deleted',
        input?: CollectionInputTypes,
        /**
         * @description
         * The state of the Collection prior to the update, populated for `updated` events so that
         * subscribers can diff against the previous values. It is loaded with the `featuredAsset`,
         * `assets`, `channels`, `parent` and `translations` relations. Note this relation set is not
         * identical to that of `entity` (the post-update collection), so reliable diffing is limited
         * to `translations`, `featuredAsset`, `assets` and scalar columns.
         *
         * @since 3.8.0
         */
        public readonly previousEntity?: Collection,
    ) {
        super(entity, type, ctx, input);
    }
}

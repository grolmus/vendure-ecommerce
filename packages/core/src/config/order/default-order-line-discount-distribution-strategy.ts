import { RequestContext } from '../../api/common/request-context';
import { OrderLine } from '../../entity/order-line/order-line.entity';

import { OrderLineDiscountDistributionStrategy } from './order-line-discount-distribution-strategy';

/**
 * @description
 * The default {@link OrderLineDiscountDistributionStrategy} which weights each OrderLine by its
 * current `proratedLinePriceWithTax`. A fully-cancelled line (`quantity === 0`) gets a weight of
 * `0`. This preserves the historical Vendure behaviour and is fully backwards-compatible.
 *
 * @docsCategory orders
 * @since 3.7.0
 */
export class DefaultOrderLineDiscountDistributionStrategy implements OrderLineDiscountDistributionStrategy {
    getWeight(ctx: RequestContext, line: OrderLine): number {
        return line.quantity !== 0 ? line.proratedLinePriceWithTax : 0;
    }
}

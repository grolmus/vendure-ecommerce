import { RequestContext } from '../../api/common/request-context';
import { InjectableStrategy } from '../../common/types/injectable-strategy';
import { OrderLine } from '../../entity/order-line/order-line.entity';
import { Order } from '../../entity/order/order.entity';

/**
 * @description
 * This strategy determines the relative weight given to each {@link OrderLine} when an
 * order-level promotion discount (from a `PromotionOrderAction`) is distributed (prorated)
 * across the lines of an Order.
 *
 * The default behaviour weights each line by its current `proratedLinePriceWithTax`, treating a
 * fully-cancelled line (`quantity === 0`) as weight `0`. This means that when a line is cancelled
 * via an order modification, its share of the order-level discount is **redistributed onto the
 * surviving lines** rather than being reclaimed with the refund — which can cause the merchant to
 * over-discount the remaining items (see [#4811](https://github.com/vendurehq/vendure/issues/4811)).
 *
 * By implementing a custom strategy you can change this, e.g. to placement-stable weighting so that
 * a cancelled line keeps its share of the discount:
 *
 * @example
 * ```ts
 * import { OrderLineDiscountDistributionStrategy, OrderLine, RequestContext } from '\@vendure/core';
 *
 * export class PlacementStableDistributionStrategy implements OrderLineDiscountDistributionStrategy {
 *     getWeight(ctx: RequestContext, line: OrderLine): number {
 *         return line.unitPriceWithTax * (line.orderPlacedQuantity || line.quantity);
 *     }
 * }
 * ```
 *
 * :::info
 *
 * This is configured via the `orderOptions.orderLineDiscountDistributionStrategy` property of
 * your VendureConfig.
 *
 * :::
 *
 * @docsCategory orders
 * @since 3.7.0
 */
export interface OrderLineDiscountDistributionStrategy extends InjectableStrategy {
    /**
     * @description
     * Returns the relative weight of the given OrderLine used when prorating an order-level
     * discount across the Order's lines. A weight of `0` means the line receives none of the
     * distributed discount.
     *
     * Note: a line's distributed share is ultimately capped at the line's own price. If a strategy
     * returns weights that are wildly disproportionate to the line prices (e.g. assigning a large
     * share to a very cheap line), that line's share will be clamped and the total distributed
     * discount may end up less than the full promotion amount.
     */
    getWeight(ctx: RequestContext, line: OrderLine, order: Order): number;
}

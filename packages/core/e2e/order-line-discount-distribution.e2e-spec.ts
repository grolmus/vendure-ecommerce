/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { LanguageCode } from '@vendure/common/lib/generated-types';
import {
    mergeConfig,
    Order,
    OrderLine,
    OrderLineDiscountDistributionStrategy,
    RequestContext,
} from '@vendure/core';
import { createTestEnvironment, SimpleGraphQLClient, TestServer } from '@vendure/testing';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { initialData } from '../../../e2e-common/e2e-initial-data';
import { TEST_SETUP_TIMEOUT_MS, testConfig } from '../../../e2e-common/test-config';
import { orderFixedDiscount } from '../src/config/promotion/actions/order-fixed-discount-action';

import { testSuccessfulPaymentMethod } from './fixtures/test-payment-methods';
import { graphql } from './graphql/graphql-admin';
import {
    adminTransitionToStateDocument,
    createPromotionDocument,
    getProductsWithVariantPricesDocument,
} from './graphql/shared-definitions';
import { addItemToOrderDocument, setCustomerDocument } from './graphql/shop-definitions';
import { addPaymentToOrder, proceedToArrangingPayment } from './utils/test-order-utils';

// #4811 — a placement-stable distribution strategy weights each line by its placed quantity, so a
// cancelled line (quantity 0, but orderPlacedQuantity > 0) keeps its share of an order-level
// discount instead of having it redistributed onto the surviving lines.
class PlacementStableDistributionStrategy implements OrderLineDiscountDistributionStrategy {
    getWeight(ctx: RequestContext, line: OrderLine): number {
        return line.unitPriceWithTax * (line.orderPlacedQuantity || line.quantity);
    }
}

// A deliberately non-price weighting, used to prove the strategy actually drives distribution.
class EqualWeightDistributionStrategy implements OrderLineDiscountDistributionStrategy {
    getWeight(ctx: RequestContext, line: OrderLine, order: Order): number {
        return line.quantity > 0 ? 1 : 0;
    }
}

const getOrderLinesDocument = graphql(`
    query GetOrderLinesForDistribution($id: ID!) {
        order(id: $id) {
            id
            totalWithTax
            lines {
                id
                quantity
                orderPlacedQuantity
                linePrice
                proratedLinePrice
                productVariant {
                    id
                }
            }
        }
    }
`);

// dryRun modification: previews the re-prorated lines after reducing a line to qty 0, without
// having to settle the resulting refund.
const previewLineRemovalDocument = graphql(`
    mutation PreviewLineRemoval($input: ModifyOrderInput!) {
        modifyOrder(input: $input) {
            ... on Order {
                id
                lines {
                    id
                    quantity
                    proratedLinePrice
                    productVariant {
                        id
                    }
                }
            }
            ... on ErrorResult {
                errorCode
                message
            }
        }
    }
`);

const paymentMethodInitialData = {
    ...initialData,
    paymentMethods: [
        {
            name: testSuccessfulPaymentMethod.code,
            handler: { code: testSuccessfulPaymentMethod.code, arguments: [] },
        },
    ],
};

const orderTenOffPromotionInput = {
    enabled: true,
    conditions: [
        {
            code: 'minimum_order_amount',
            arguments: [
                { name: 'amount', value: '100' },
                { name: 'taxInclusive', value: 'false' },
            ],
        },
    ],
    actions: [{ code: orderFixedDiscount.code, arguments: [{ name: 'discount', value: '1000' }] }],
    translations: [{ languageCode: LanguageCode.en, name: 'Order $10 off' }],
};

interface DistributionTestContext {
    cheapVariantId: string;
    expensiveVariantId: string;
}

async function setupDistributionTest(
    server: TestServer,
    adminClient: SimpleGraphQLClient,
): Promise<DistributionTestContext> {
    await server.init({
        initialData: paymentMethodInitialData,
        productsCsvPath: path.join(__dirname, 'fixtures/e2e-products-promotions.csv'),
        customerCount: 1,
    });
    await adminClient.asSuperAdmin();
    const { products } = await adminClient.query(getProductsWithVariantPricesDocument);
    const variants = products.items.flatMap(p => p.variants);
    await adminClient.query(createPromotionDocument, { input: orderTenOffPromotionInput });
    return {
        cheapVariantId: variants.find(v => v.price === 1000)!.id,
        expensiveVariantId: variants.find(v => v.price === 5000)!.id,
    };
}

/**
 * Places an order (PaymentSettled) containing the expensive + cheap variant, then returns the
 * order id. Each call uses a unique customer email so usage limits etc. don't interfere.
 */
async function placeTwoLineOrder(
    shopClient: SimpleGraphQLClient,
    ctx: DistributionTestContext,
    email: string,
): Promise<string> {
    await shopClient.asAnonymousUser();
    await shopClient.query(addItemToOrderDocument, { productVariantId: ctx.expensiveVariantId, quantity: 1 });
    await shopClient.query(addItemToOrderDocument, { productVariantId: ctx.cheapVariantId, quantity: 1 });
    await shopClient.query(setCustomerDocument, {
        input: { emailAddress: email, firstName: 'Dist', lastName: 'Test' },
    });
    await proceedToArrangingPayment(shopClient);
    const order = await addPaymentToOrder(shopClient, testSuccessfulPaymentMethod);
    expect(order.state).toBe('PaymentSettled');
    return order.id;
}

const lineFor = (variantId: string, order: any) =>
    order.lines.find((l: any) => l.productVariant.id === variantId)!;

describe('OrderLineDiscountDistributionStrategy (#4811)', () => {
    describe('default (price-weighted) strategy', () => {
        const { server, shopClient, adminClient } = createTestEnvironment(
            mergeConfig(testConfig(), {
                paymentOptions: { paymentMethodHandlers: [testSuccessfulPaymentMethod] },
            }),
        );
        let testCtx: DistributionTestContext;

        beforeAll(async () => {
            testCtx = await setupDistributionTest(server, adminClient);
        }, TEST_SETUP_TIMEOUT_MS);

        afterAll(async () => {
            await server.destroy();
        });

        it('prorates the order-level discount by line price', async () => {
            const orderId = await placeTwoLineOrder(shopClient, testCtx, 'default-distribution@test.com');
            const { order } = await adminClient.query(getOrderLinesDocument, { id: orderId });
            const expensive = lineFor(testCtx.expensiveVariantId, order);
            const cheap = lineFor(testCtx.cheapVariantId, order);
            // $10 (1000) discount split by withTax line price (6000 : 1200) → 833 / 167.
            expect(expensive.linePrice - expensive.proratedLinePrice).toBe(833);
            expect(cheap.linePrice - cheap.proratedLinePrice).toBe(167);
        });

        // Documents the historical (default) behaviour the issue is about: when a line is removed
        // via an order modification, its share of the order-level discount IS redistributed onto
        // the survivor, so the survivor becomes cheaper.
        it("redistributes a removed line's discount share onto the survivor", async () => {
            const orderId = await placeTwoLineOrder(shopClient, testCtx, 'default-cancel@test.com');
            const { order: before } = await adminClient.query(getOrderLinesDocument, { id: orderId });
            const cheapBefore = lineFor(testCtx.cheapVariantId, before);
            const expensiveLine = lineFor(testCtx.expensiveVariantId, before);

            await adminClient.query(adminTransitionToStateDocument, { id: orderId, state: 'Modifying' });
            const { modifyOrder } = await adminClient.query(previewLineRemovalDocument, {
                input: {
                    orderId,
                    dryRun: true,
                    adjustOrderLines: [{ orderLineId: expensiveLine.id, quantity: 0 }],
                },
            });
            const cheapAfter = lineFor(testCtx.cheapVariantId, modifyOrder as any);
            // Survivor absorbs the removed line's share → becomes cheaper than before.
            expect(cheapAfter.proratedLinePrice).toBeLessThan(cheapBefore.proratedLinePrice);
        });
    });

    describe('custom equal-weight strategy', () => {
        const { server, shopClient, adminClient } = createTestEnvironment(
            mergeConfig(testConfig(), {
                paymentOptions: { paymentMethodHandlers: [testSuccessfulPaymentMethod] },
                orderOptions: {
                    orderLineDiscountDistributionStrategy: new EqualWeightDistributionStrategy(),
                },
            }),
        );
        let testCtx: DistributionTestContext;

        beforeAll(async () => {
            testCtx = await setupDistributionTest(server, adminClient);
        }, TEST_SETUP_TIMEOUT_MS);

        afterAll(async () => {
            await server.destroy();
        });

        it('distributes the order-level discount according to the strategy weights', async () => {
            const orderId = await placeTwoLineOrder(shopClient, testCtx, 'equal-distribution@test.com');
            const { order } = await adminClient.query(getOrderLinesDocument, { id: orderId });
            const expensive = lineFor(testCtx.expensiveVariantId, order);
            const cheap = lineFor(testCtx.cheapVariantId, order);
            // Equal weights → the $10 discount splits evenly (500 / 500), not by price.
            expect(expensive.linePrice - expensive.proratedLinePrice).toBe(500);
            expect(cheap.linePrice - cheap.proratedLinePrice).toBe(500);
        });
    });

    describe('custom placement-stable strategy', () => {
        const { server, shopClient, adminClient } = createTestEnvironment(
            mergeConfig(testConfig(), {
                paymentOptions: { paymentMethodHandlers: [testSuccessfulPaymentMethod] },
                orderOptions: {
                    orderLineDiscountDistributionStrategy: new PlacementStableDistributionStrategy(),
                },
            }),
        );
        let testCtx: DistributionTestContext;

        beforeAll(async () => {
            testCtx = await setupDistributionTest(server, adminClient);
        }, TEST_SETUP_TIMEOUT_MS);

        afterAll(async () => {
            await server.destroy();
        });

        it("keeps a removed line's discount share off the surviving lines", async () => {
            const orderId = await placeTwoLineOrder(shopClient, testCtx, 'placement-stable@test.com');
            const { order: before } = await adminClient.query(getOrderLinesDocument, { id: orderId });
            const cheapBefore = lineFor(testCtx.cheapVariantId, before);
            const expensiveLine = lineFor(testCtx.expensiveVariantId, before);

            await adminClient.query(adminTransitionToStateDocument, { id: orderId, state: 'Modifying' });
            const { modifyOrder } = await adminClient.query(previewLineRemovalDocument, {
                input: {
                    orderId,
                    dryRun: true,
                    adjustOrderLines: [{ orderLineId: expensiveLine.id, quantity: 0 }],
                },
            });
            const cheapAfter = lineFor(testCtx.cheapVariantId, modifyOrder as any);
            // The survivor keeps exactly its placement-time prorated price — the removed line's
            // share is reclaimed rather than redistributed onto the survivor.
            expect(cheapAfter.proratedLinePrice).toBe(cheapBefore.proratedLinePrice);
        });
    });
});

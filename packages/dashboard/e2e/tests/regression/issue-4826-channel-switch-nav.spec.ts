import { expect, type Page, test } from '@playwright/test';

import { VendureAdminClient } from '../../utils/vendure-admin-client.js';

// #4826 — switching channel while viewing a channel-scoped entity must not leave
// the stale entity (and its breadcrumb/nav links, which 404 when clicked) on
// screen. The dashboard returns to home when leaving an entity detail page, but
// leaves channel-agnostic list pages in place.

async function ensureSecondChannel(client: VendureAdminClient) {
    const { channels } = await client.gql(`query { channels { items { id code } } }`);
    if (channels.items.some((c: any) => c.code === 'second-channel')) {
        return;
    }
    const { zones } = await client.gql(`query { zones { items { id } } }`);
    if (!zones.items.length) {
        throw new Error('No zones available to create second-channel');
    }
    const zoneId = zones.items[0].id;
    let createChannel: { id: string } | { errorCode: string; message: string };
    try {
        ({ createChannel } = await client.gql(
            `mutation ($input: CreateChannelInput!) {
                createChannel(input: $input) {
                    ... on Channel { id }
                    ... on ErrorResult { errorCode message }
                }
            }`,
            {
                input: {
                    code: 'second-channel',
                    token: 'second-channel-token',
                    defaultLanguageCode: 'en',
                    currencyCode: 'USD',
                    pricesIncludeTax: false,
                    defaultTaxZoneId: zoneId,
                    defaultShippingZoneId: zoneId,
                },
            },
        ));
    } catch (e) {
        // A concurrent run may have created it first (unique-constraint error).
        // Tolerate only if it now exists; otherwise the failure is real.
        const { channels: after } = await client.gql(`query { channels { items { code } } }`);
        if (after.items.some((c: any) => c.code === 'second-channel')) {
            return;
        }
        throw e;
    }
    if (!('id' in createChannel)) {
        throw new Error(
            `Failed to create second-channel: ${createChannel.errorCode} ${createChannel.message}`,
        );
    }
}

async function switchToSecondChannel(page: Page) {
    await page.getByRole('button').filter({ hasText: 'Default channel' }).first().click();
    await page.getByRole('menuitem').filter({ hasText: 'second-channel' }).click();
}

test('returns to dashboard home when switching channel from an entity detail', async ({ page }) => {
    test.setTimeout(120_000);
    const client = new VendureAdminClient(page);
    await client.login();
    await ensureSecondChannel(client);

    const { products } = await client.gql(`query { products(options: { take: 1 }) { items { id name } } }`);
    const product = products.items[0] as { id: string; name: string };

    await page.goto(`/products/${product.id}`);
    const breadcrumb = page.getByRole('navigation', { name: 'breadcrumb' });
    await breadcrumb.getByText(product.name, { exact: false }).first().waitFor({ timeout: 15_000 });

    await switchToSecondChannel(page);

    // Primary signal: navigated to the (channel-neutral) dashboard home.
    await page.waitForURL(url => new URL(url).pathname === '/', { timeout: 10_000 });
    // The stale product breadcrumb is gone.
    await expect(breadcrumb.getByText(product.name, { exact: false })).toHaveCount(0);
});

test('stays on a channel-agnostic list page when switching channel', async ({ page }) => {
    test.setTimeout(120_000);
    const client = new VendureAdminClient(page);
    await client.login();
    await ensureSecondChannel(client);

    await page.goto('/products');
    await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toBeVisible({ timeout: 15_000 });

    await switchToSecondChannel(page);

    // Wait until the switch has actually taken effect — the switcher now shows the
    // new channel. That's the same signal that would drive a redirect, so once it
    // resolves we can assert no redirect happened (still on the list page).
    await expect(page.getByRole('button').filter({ hasText: 'second-channel' })).toBeVisible({
        timeout: 10_000,
    });
    // List pages are valid in any channel — we must NOT bounce to home.
    expect(new URL(page.url()).pathname).toBe('/products');
});

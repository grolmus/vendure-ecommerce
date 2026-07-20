import { type Page, expect, test } from '@playwright/test';

import { BaseDetailPage } from '../../page-objects/detail-page.base.js';
import { BaseListPage } from '../../page-objects/list-page.base.js';

// Channels have dependent selectors: available languages/currencies must be set
// before their respective defaults. Zone selectors are standard Base UI Selects.

test.describe('Channels CRUD', () => {
    test.describe.configure({ mode: 'serial' });

    const listPage = (page: Page) =>
        new BaseListPage(page, {
            path: '/channels',
            title: 'Channels',
            newButtonLabel: 'New Channel',
        });

    const detailPage = (page: Page) =>
        new BaseDetailPage(page, {
            newPath: '/channels/new',
            pathPrefix: '/channels/',
            newTitle: 'New channel',
        });

    test('should display the channels list page', async ({ page }) => {
        const lp = listPage(page);
        await lp.goto();
        await lp.expectLoaded();
    });

    test('should show the default channel', async ({ page }) => {
        const lp = listPage(page);
        await lp.goto();
        await lp.expectLoaded();
        // ChannelCodeLabel renders the default channel code as "Default channel"
        await expect(lp.getRows().filter({ hasText: 'Default channel' }).first()).toBeVisible();
    });

    test('should navigate to channel detail', async ({ page }) => {
        const lp = listPage(page);
        await lp.goto();
        await lp.expectLoaded();
        await lp.clickEntity('Default channel');
        await expect(page).toHaveURL(/\/channels\/[^/]+$/);
    });

    test('should create a new channel', async ({ page }) => {
        const dp = detailPage(page);
        await dp.gotoNew();
        await dp.expectNewPageLoaded();

        await dp.fillInput('Code', 'e2e-test-channel');
        await dp.fillInput('Token', 'e2e-test-token');

        // Available languages — MultiSelect popover (few items, no search input)
        await dp.formItem('Available languages').getByRole('combobox').click();
        await page.getByRole('option', { name: /English/ }).click();
        // Click outside to close the popover and let form state propagate
        await page.locator('body').click({ position: { x: 0, y: 0 } });
        await expect(page.locator('[data-slot="popover-content"]')).not.toBeVisible();

        // Default language — single-select filtered by available languages
        await dp.formItem('Default language').getByRole('combobox').click();
        await page.getByRole('option', { name: /English/ }).click();

        // Available currencies — MultiSelect popover (100+ items, search shows)
        const availableCurrencies = dp.formItem('Available currencies').getByRole('combobox');
        await availableCurrencies.fill('Dollar');
        await page.getByRole('option', { name: 'Australian Dollar (A$)', exact: true }).click();
        await page.keyboard.press('Escape');

        // Default currency — single-select filtered by available currencies
        await dp.formItem('Default currency').getByRole('combobox').click();
        await page
            .locator('[data-slot="select-content"]')
            .getByRole('option', { name: 'Australian Dollar (A$)', exact: true })
            .click();

        // Default tax zone — Base UI Select
        await dp.selectOption('Default tax zone', 'Europe');

        // Default shipping zone — Base UI Select
        await dp.selectOption('Default shipping zone', 'Europe');

        await dp.clickCreate();
        await dp.expectSuccessToast(/Successfully created channel/);
        await dp.expectNavigatedToExisting();
    });

    test('should find the created channel in the list', async ({ page }) => {
        const lp = listPage(page);
        await lp.goto();
        await lp.expectLoaded();
        await expect(lp.getRows().filter({ hasText: 'e2e-test-channel' }).first()).toBeVisible();
    });

    test('should navigate to created channel detail page', async ({ page }) => {
        const lp = listPage(page);
        await lp.goto();
        await lp.expectLoaded();
        await lp.clickEntity('e2e-test-channel');
        await expect(page).toHaveURL(/\/channels\/[^/]+$/);
    });

    test('should update the channel', async ({ page }) => {
        const lp = listPage(page);
        await lp.goto();
        await lp.expectLoaded();
        await lp.clickEntity('e2e-test-channel');
        await expect(page).toHaveURL(/\/channels\/[^/]+$/);

        const dp = detailPage(page);
        await dp.fillInput('Token', 'e2e-updated-token');
        await dp.clickUpdate();
        await dp.expectSuccessToast(/Successfully updated channel/);
    });

    test('should show updated channel in the list', async ({ page }) => {
        const lp = listPage(page);
        await lp.goto();
        await lp.expectLoaded();
        await expect(lp.getRows().filter({ hasText: 'e2e-test-channel' }).first()).toBeVisible();
    });

    test('should bulk-delete the test channel', async ({ page }) => {
        const lp = listPage(page);
        await lp.goto();
        await lp.expectLoaded();

        const testChannelRow = lp.getRows().filter({ hasText: 'e2e-test-channel' });
        await testChannelRow.getByRole('checkbox').click();
        await page.getByRole('button', { name: /Actions/i }).click();
        await page.locator('[role="menu"]').getByText('Delete', { exact: true }).click();
        await page.locator('[role="alertdialog"]').getByRole('button', { name: 'Continue' }).click();
        await lp.expectSuccessToast();

        await expect(lp.getRows().filter({ hasText: 'e2e-test-channel' })).toHaveCount(0);
    });
});

// #4173 — creating a channel with missing required fields produced a raw GraphQL error toast,
// and the offending fields were not highlighted. Required `ID!` relations (default tax/shipping
// zone) were seeded with '' and passed the generated `z.string()`, then got stripped from the
// payload and blew up during server-side variable coercion. `defaultCurrencyCode` is nullable in
// the schema but still required by ChannelService.create, which throws a raw UserInputError
// ("Either a defaultCurrencyCode or currencyCode must be provided").

// The Design System v2 MultiSelect renders a Base UI combobox: options live in a portalled
// `listbox`, and a multi-select shows its value as chips rather than as text inside the input.
// Closing leaves an inert backdrop behind for a moment, which swallows the next click, so wait
// for it to go away before interacting again.
async function closeDropdown(page: Page) {
    // Click away rather than pressing Escape: Escape leaves focus on the trigger, which can
    // re-open the dropdown and leave its inert backdrop swallowing the next click. This is the
    // same dismissal the Channels CRUD tests above use.
    await page.locator('body').click({ position: { x: 0, y: 0 } });
    // A closed dropdown can stay mounted but hidden, so assert on visibility rather than presence.
    await expect(page.getByRole('listbox').filter({ visible: true })).toHaveCount(0);
    await expect(page.locator('[data-base-ui-inert]')).toHaveCount(0);
}

const currencyChips = (dp: BaseDetailPage) => dp.formItem('Available currencies');

test.describe('Channel required-field validation', () => {
    const detailPage = (page: Page) =>
        new BaseDetailPage(page, {
            newPath: '/channels/new',
            pathPrefix: '/channels/',
            newTitle: 'New channel',
        });

    test('should show inline errors instead of a raw GraphQL toast when required fields are missing', async ({
        page,
    }) => {
        const dp = detailPage(page);
        await dp.gotoNew();
        await dp.expectNewPageLoaded();

        // Fill only `code`, exactly as the issue describes ("fill in some of the required
        // fields"). This also makes the form dirty, so the Create button is enabled.
        await dp.fillInput('Code', 'e2e-incomplete-channel');
        await dp.clickCreate();

        // Each missing required field is called out in place...
        for (const label of ['Token', 'Default tax zone', 'Default shipping zone']) {
            await expect(dp.formItem(label).getByText('This field is required')).toBeVisible();
        }

        // ...including both halves of the currency pair: the default cannot be picked until a
        // currency is available, so the error points at the field to fill in first, and the
        // available list is flagged in its own right rather than left for the user to infer.
        await expect(
            dp
                .formItem('Default currency')
                .getByText('You must first select an available currency to set a default currency'),
        ).toBeVisible();
        await expect(
            dp.formItem('Available currencies').getByText('You must select at least one available currency'),
        ).toBeVisible();

        // ...and the mutation never leaves the client, so there is no raw GraphQL error toast.
        await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
        await expect(page).toHaveURL(/\/channels\/new$/);
    });

    // #4173 — the default currency used to be pickable from every currency there is while
    // "Available currencies" was still empty, so it could be left out of the list chosen
    // afterwards. The available currencies are now the only source of a default.
    test('should offer no default currency until an available currency is chosen', async ({ page }) => {
        const dp = detailPage(page);
        await dp.gotoNew();
        await dp.expectNewPageLoaded();

        await dp.fillInput('Code', 'e2e-default-source-channel');
        await dp.fillInput('Token', 'e2e-default-source-token');

        // Nothing is available, so there is nothing to make the default.
        await dp.formItem('Default currency').getByRole('combobox').click();
        await expect(page.getByRole('option')).toHaveCount(0);
        await closeDropdown(page);

        // Marking one currency available makes it — and only it — a candidate default.
        await dp.formItem('Available currencies').getByRole('combobox').click();
        await page.getByRole('option', { name: /Euro/ }).first().click();
        await closeDropdown(page);
        await expect(currencyChips(dp)).toContainText('Euro');

        await dp.formItem('Default currency').getByRole('combobox').click();
        await expect(page.getByRole('option')).toHaveCount(1);
        await page.getByRole('option', { name: /Euro/ }).click();
        // A single-select closes itself once a value is picked.
        await expect(page.getByRole('listbox').filter({ visible: true })).toHaveCount(0);
        await expect(dp.formItem('Default currency').getByRole('combobox')).toContainText('Euro');

        await dp.selectOption('Default tax zone', 'Europe');
        await dp.selectOption('Default shipping zone', 'Europe');

        await dp.clickCreate();
        await dp.expectSuccessToast(/Successfully created channel/);
        await dp.expectNavigatedToExisting();

        // The default is among the saved channel's available currencies, because it came from them.
        await page.reload();
        await expect(currencyChips(dp)).toContainText('Euro');
        await expect(dp.formItem('Default currency').getByRole('combobox')).toContainText('Euro');
    });

    // #4173 — picking the default from the available list is not enough on its own: the list can
    // still be narrowed afterwards. ChannelService.create saves a supplied list verbatim without
    // checking that it contains the default, so this has to be caught here.
    test('should reject a default currency dropped from the available currencies', async ({ page }) => {
        const dp = detailPage(page);
        await dp.gotoNew();
        await dp.expectNewPageLoaded();

        await dp.fillInput('Code', 'e2e-default-dropped-channel');
        await dp.fillInput('Token', 'e2e-default-dropped-token');
        await dp.selectOption('Default tax zone', 'Europe');
        await dp.selectOption('Default shipping zone', 'Europe');

        // Two available currencies...
        // Pick both from one open list: a multi-select only closes on selection when a filter is
        // active, so selecting unfiltered keeps the dropdown open for the next one.
        await dp.formItem('Available currencies').getByRole('combobox').click();
        for (const currency of ['US Dollar', 'Euro']) {
            await page
                .getByRole('option', { name: new RegExp(currency) })
                .first()
                .click();
        }
        await closeDropdown(page);

        // ...one of which becomes the default...
        await dp.formItem('Default currency').getByRole('combobox').click();
        await page.getByRole('option', { name: /US Dollar/ }).click();
        await expect(dp.formItem('Default currency').getByRole('combobox')).toContainText('US Dollar');

        // ...and is then taken back off the available list via its badge.
        await dp
            .formItem('Available currencies')
            .locator('[data-slot="combobox-chip"]')
            .filter({ hasText: 'US Dollar' })
            .locator('[data-slot="combobox-chip-remove"]')
            .click();

        await dp.clickCreate();
        await expect(
            dp
                .formItem('Default currency')
                .getByText('You must select a default currency from the list of available currencies'),
        ).toBeVisible();
        await expect(page).toHaveURL(/\/channels\/new$/);
    });

    test('should clear the error once a required field is filled', async ({ page }) => {
        const dp = detailPage(page);
        await dp.gotoNew();
        await dp.expectNewPageLoaded();

        await dp.fillInput('Code', 'e2e-incomplete-channel');
        await dp.clickCreate();
        await expect(dp.formItem('Token').getByText('This field is required')).toBeVisible();

        await dp.fillInput('Token', 'e2e-some-token');
        await expect(dp.formItem('Token').getByText('This field is required')).not.toBeVisible();
    });
});

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// Capture the props ListPage forwards to PaginatedListDataTable.
const captured: { props?: Record<string, any> } = {};

vi.mock('@/vdb/components/shared/paginated-list-data-table.js', () => ({
    PaginatedListDataTable: (props: Record<string, any>) => {
        captured.props = props;
        return null;
    },
}));

vi.mock('../layout-engine/page-layout.js', () => ({
    Page: ({ children }: any) => <>{children}</>,
    PageTitle: ({ children }: any) => <>{children}</>,
    PageActionBar: ({ children }: any) => <>{children}</>,
    PageLayout: ({ children }: any) => <>{children}</>,
    FullWidthPageBlock: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/vdb/hooks/use-user-settings.js', () => ({
    useUserSettings: () => ({ setTableSettings: vi.fn(), settings: {} }),
}));

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
}));

// eslint-disable-next-line import/first
import { ListPage } from './list-page.js';

describe('ListPage prop forwarding', () => {
    const baseProps = {
        route: { useSearch: () => ({}), fullPath: '/' },
        title: 'Test',
        listQuery: {} as any,
    };

    it('forwards transformQueryKey, disableViewOptions and includeSelectionColumn to PaginatedListDataTable', () => {
        const transformQueryKey = (queryKey: any[]) => [...queryKey, 'extra'];

        renderToStaticMarkup(
            React.createElement(ListPage as any, {
                ...baseProps,
                transformQueryKey,
                disableViewOptions: true,
                // false is the non-default value, so this asserts the value is really forwarded
                // rather than coinciding with PaginatedListDataTable's own default of true.
                includeSelectionColumn: false,
            }),
        );

        expect(captured.props?.transformQueryKey).toBe(transformQueryKey);
        expect(captured.props?.disableViewOptions).toBe(true);
        expect(captured.props?.includeSelectionColumn).toBe(false);
    });

    it('does not inject the forwarded props when they are not provided', () => {
        renderToStaticMarkup(React.createElement(ListPage as any, { ...baseProps }));

        expect(captured.props?.transformQueryKey).toBeUndefined();
        expect(captured.props?.disableViewOptions).toBeUndefined();
        expect(captured.props?.includeSelectionColumn).toBeUndefined();
    });
});

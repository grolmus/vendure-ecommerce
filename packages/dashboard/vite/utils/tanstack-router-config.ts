import type { tanstackRouter } from '@tanstack/router-plugin/vite';
import path from 'path';

/**
 * @description
 * The options accepted by the underlying TanStack Router Vite plugin (`tanstackRouter()`).
 */
// Derived from the plugin's own (un-exported, inferred) signature so it tracks the installed version.
export type TanstackRouterPluginOptions = NonNullable<Parameters<typeof tanstackRouter>[0]>;

// Fixed to the Dashboard's expected layout — route discovery and generation depend on these exact
// paths, so user-provided overrides are ignored (with a warning) rather than silently breaking the build.
const DASHBOARD_MANAGED_KEYS = ['routesDirectory', 'generatedRouteTree'] as const;

/**
 * @description
 * Builds the options passed to the `tanstackRouter` Vite plugin. The Dashboard's own defaults are
 * merged with the user-provided `pluginOptions`, which can override anything except the keys the
 * Dashboard manages itself ({@link DASHBOARD_MANAGED_KEYS}).
 *
 * This lets deployments customize most aspects of the TanStack Router plugin — for example setting
 * `tmpDir` when the default temp directory is on a different device than the generated route tree,
 * which otherwise causes the build to fail with `EXDEV: cross-device link not permitted` during
 * route-tree generation. See #4048.
 */
export function buildTanstackRouterPluginConfig(
    packageRoot: string,
    pluginOptions: TanstackRouterPluginOptions = {},
): TanstackRouterPluginOptions {
    const ignored = DASHBOARD_MANAGED_KEYS.filter(key => key in pluginOptions);
    if (ignored.length) {
        console.warn(
            `[vendure:dashboard] Ignoring tanstackRouterPluginOptions managed by the Dashboard: ` +
                `${ignored.join(', ')}. These are fixed to ensure route generation works.`,
        );
    }
    return {
        autoCodeSplitting: true,
        routeFileIgnorePattern: '.graphql.ts|components|hooks|utils',
        ...pluginOptions,
        routesDirectory: path.join(packageRoot, 'src/app/routes'),
        generatedRouteTree: path.join(packageRoot, 'src/app/routeTree.gen.ts'),
    };
}

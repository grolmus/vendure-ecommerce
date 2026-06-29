import type { tanstackRouter } from '@tanstack/router-plugin/vite';
import path from 'path';

/**
 * @description
 * The options accepted by the underlying TanStack Router Vite plugin (`tanstackRouter()`).
 */
// Derived from the plugin's own (un-exported, inferred) signature so it tracks the installed version.
export type TanstackRouterPluginOptions = NonNullable<Parameters<typeof tanstackRouter>[0]>;

/**
 * @description
 * Builds the options passed to the `tanstackRouter` Vite plugin. The Dashboard's own defaults
 * (routes directory, generated route tree, code splitting) can be overridden by passing
 * `pluginOptions`, which are merged on top of the defaults.
 *
 * This lets deployments customize any aspect of the TanStack Router plugin — for example setting
 * `tmpDir` when the default temp directory is on a different device than the generated route tree,
 * which otherwise causes the build to fail with `EXDEV: cross-device link not permitted` during
 * route-tree generation. See #4048.
 */
export function buildTanstackRouterPluginConfig(
    packageRoot: string,
    pluginOptions?: TanstackRouterPluginOptions,
): TanstackRouterPluginOptions {
    return {
        autoCodeSplitting: true,
        routeFileIgnorePattern: '.graphql.ts|components|hooks|utils',
        routesDirectory: path.join(packageRoot, 'src/app/routes'),
        generatedRouteTree: path.join(packageRoot, 'src/app/routeTree.gen.ts'),
        ...pluginOptions,
    };
}

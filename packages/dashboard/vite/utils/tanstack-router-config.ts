import path from 'path';

/**
 * @description
 * The subset of TanStack Router plugin options configured by the Vendure Dashboard plugin.
 */
export interface TanstackRouterPluginConfig {
    autoCodeSplitting: boolean;
    routeFileIgnorePattern: string;
    routesDirectory: string;
    generatedRouteTree: string;
    /**
     * Directory used by the TanStack Router plugin for temporary files. Only included when
     * explicitly configured — otherwise the plugin's own default is used. See #4048.
     */
    tmpDir?: string;
}

/**
 * @description
 * Builds the options passed to the `tanstackRouter` Vite plugin. `tmpDir` is only set when
 * provided so the default behaviour is unchanged; configuring it lets deployments whose temp
 * directory sits on a different device than the generated route tree avoid the TanStack Router
 * `EXDEV: cross-device link not permitted` rename error. See #4048.
 */
export function buildTanstackRouterPluginConfig(
    packageRoot: string,
    tmpDir?: string,
): TanstackRouterPluginConfig {
    return {
        autoCodeSplitting: true,
        routeFileIgnorePattern: '.graphql.ts|components|hooks|utils',
        routesDirectory: path.join(packageRoot, 'src/app/routes'),
        generatedRouteTree: path.join(packageRoot, 'src/app/routeTree.gen.ts'),
        ...(tmpDir ? { tmpDir } : {}),
    };
}

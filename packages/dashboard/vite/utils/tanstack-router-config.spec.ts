import path from 'path';
import { describe, expect, it } from 'vitest';

import { buildTanstackRouterPluginConfig } from './tanstack-router-config.js';

// https://github.com/vendurehq/vendure/issues/4048
describe('buildTanstackRouterPluginConfig', () => {
    const packageRoot = '/abs/dashboard';

    it('includes the configured tmpDir', () => {
        const config = buildTanstackRouterPluginConfig(packageRoot, '/custom/tanstack-tmp');
        expect(config.tmpDir).toBe('/custom/tanstack-tmp');
    });

    it('omits tmpDir when none is provided (preserving the plugin default)', () => {
        const config = buildTanstackRouterPluginConfig(packageRoot);
        expect('tmpDir' in config).toBe(false);
    });

    it('keeps the standard route-generation options', () => {
        const config = buildTanstackRouterPluginConfig(packageRoot, '/custom/tanstack-tmp');
        expect(config.autoCodeSplitting).toBe(true);
        expect(config.routesDirectory).toBe(path.join(packageRoot, 'src/app/routes'));
        expect(config.generatedRouteTree).toBe(path.join(packageRoot, 'src/app/routeTree.gen.ts'));
    });
});

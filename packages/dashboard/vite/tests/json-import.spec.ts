import { existsSync, readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { compile } from '../utils/compiler.js';
import { debugLogger, noopLogger } from '../utils/logger.js';

// #4807 — the config loader walked only ts/tsx/js/jsx imports, so JSON modules
// imported by the config (directly or via a plugin) were never copied to the
// temp dir and the compiled config crashed with "Cannot find module './x.json'".
// In ESM mode the emitted import also needs a `with { type: 'json' }` attribute.
describe('compiling a config that imports JSON files', () => {
    for (const module of ['commonjs', 'esm'] as const) {
        it(`copies JSON imports and loads the config (${module})`, { timeout: 60_000 }, async () => {
            const tempDir = join(__dirname, `./__temp/json-import-${module}`);
            await rm(tempDir, { recursive: true, force: true });

            const result = await compile({
                outputPath: tempDir,
                vendureConfigPath: join(__dirname, 'fixtures-json-import', 'vendure-config.ts'),
                logger: process.env.LOG ? debugLogger : noopLogger,
                module,
            });

            // The config loaded, proving the directly-imported JSON resolved at runtime.
            expect(result.vendureConfig.apiOptions?.port).toBe(3456);
            // The transitive (plugin) JSON value survived — wired through, not just copied.
            expect((result.vendureConfig.plugins?.[0] as any).pluginName).toBe('from-plugin-json');

            // Both the direct and the transitive JSON files were copied verbatim.
            expect(existsSync(join(tempDir, 'data.json'))).toBe(true);
            expect(existsSync(join(tempDir, 'my-plugin', 'plugin-data.json'))).toBe(true);

            if (module === 'esm') {
                // ESM JSON imports must carry the `with { type: 'json' }` attribute,
                // or Node throws ERR_IMPORT_ATTRIBUTE_MISSING at load. (The vitest
                // loader tolerates its absence, so assert on the emitted source.)
                const compiledConfig = readFileSync(join(tempDir, 'vendure-config.js'), 'utf-8');
                expect(compiledConfig).toMatch(
                    /from\s+["']\.\/data\.json["']\s+with\s*\{\s*type:\s*["']json["']\s*\}/,
                );
            }
        });
    }
});

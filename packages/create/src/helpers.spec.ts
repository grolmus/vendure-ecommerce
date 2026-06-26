import { describe, expect, it } from 'vitest';

import { detectPackageManager, getInstallCommand } from './helpers';

// #4390 — `bunx @vendure/create` failed with `spawn npm ENOENT` because the
// installer hard-coded `npm`. These cover the package-manager detection and the
// per-manager install command used to fix it.
describe('detectPackageManager', () => {
    it('detects each package manager from its npm_config_user_agent', () => {
        expect(detectPackageManager('npm/10.2.4 node/v20.11.0 linux x64')).toBe('npm');
        expect(detectPackageManager('yarn/1.22.19 npm/? node/v20.11.0 linux x64')).toBe('yarn');
        expect(detectPackageManager('pnpm/8.15.1 npm/? node/v20.11.0 linux x64')).toBe('pnpm');
        expect(detectPackageManager('bun/1.3.5 npm/? node/v20.11.0 linux x64')).toBe('bun');
    });

    it('detects a bare manager name with no version segment', () => {
        expect(detectPackageManager('pnpm')).toBe('pnpm');
    });

    it('falls back to npm for empty or unknown user agents', () => {
        expect(detectPackageManager('')).toBe('npm');
        expect(detectPackageManager('deno/1.40.0')).toBe('npm');
    });

    it('falls back to npm when no user agent env var is set', () => {
        const original = process.env.npm_config_user_agent;
        delete process.env.npm_config_user_agent;
        try {
            expect(detectPackageManager()).toBe('npm');
        } finally {
            if (original !== undefined) {
                process.env.npm_config_user_agent = original;
            }
        }
    });
});

describe('getInstallCommand', () => {
    const deps = ['@vendure/core@3.0.0', 'dotenv'];

    it('builds npm install with exact versions', () => {
        const { command, args } = getInstallCommand('npm', { dependencies: deps, logLevel: 'silent' });
        expect(command).toBe('npm');
        expect(args).toEqual([
            'install',
            '--save',
            '--save-exact',
            '--loglevel',
            'error',
            '@vendure/core@3.0.0',
            'dotenv',
        ]);
    });

    it('adds --save-dev for npm dev dependencies and --verbose when verbose', () => {
        const { args } = getInstallCommand('npm', {
            dependencies: deps,
            isDevDependencies: true,
            logLevel: 'verbose',
        });
        expect(args).toContain('--save-dev');
        expect(args).toContain('--verbose');
    });

    it('uses `add --exact` for yarn and bun', () => {
        for (const pm of ['yarn', 'bun'] as const) {
            const prod = getInstallCommand(pm, { dependencies: deps, logLevel: 'silent' });
            expect(prod.command).toBe(pm);
            expect(prod.args).toEqual(['add', '--exact', '@vendure/core@3.0.0', 'dotenv']);

            const dev = getInstallCommand(pm, {
                dependencies: deps,
                isDevDependencies: true,
                logLevel: 'silent',
            });
            expect(dev.args).toEqual(['add', '--exact', '--dev', '@vendure/core@3.0.0', 'dotenv']);
        }
    });

    it('uses `add --save-exact` / `--save-dev` for pnpm', () => {
        const prod = getInstallCommand('pnpm', { dependencies: deps, logLevel: 'silent' });
        expect(prod).toEqual({
            command: 'pnpm',
            args: ['add', '--save-exact', '@vendure/core@3.0.0', 'dotenv'],
        });
        const dev = getInstallCommand('pnpm', {
            dependencies: deps,
            isDevDependencies: true,
            logLevel: 'silent',
        });
        expect(dev.args).toContain('--save-dev');
    });
});

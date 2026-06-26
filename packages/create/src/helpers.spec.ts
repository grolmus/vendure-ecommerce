import { describe, expect, it } from 'vitest';

import { detectPackageManager, getInstallCommand, getPackageManagerInfo } from './helpers';
import { PackageManager } from './types';

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

    // #4390 — with no explicit packages (e.g. installing the downloaded storefront from
    // its own manifest), `<pm> add` with no args errors for yarn/pnpm/bun, so we fall
    // back to the plain `install` subcommand which all four managers accept.
    it('installs from the manifest with a bare `install` when there are no dependencies', () => {
        for (const pm of ['npm', 'yarn', 'pnpm', 'bun'] as const) {
            expect(getInstallCommand(pm, { dependencies: [], logLevel: 'silent' })).toEqual({
                command: pm,
                args: ['install'],
            });
        }
    });
});

describe('getPackageManagerInfo', () => {
    it('provides idiomatic run/install/ci-install/lockfile per manager', () => {
        const expected: Record<
            PackageManager,
            { runScript: string; install: string; ciInstall: string; lockfile: string }
        > = {
            npm: {
                runScript: 'npm run',
                install: 'npm install',
                ciInstall: 'npm ci',
                lockfile: 'package-lock.json',
            },
            yarn: {
                runScript: 'yarn',
                install: 'yarn install',
                ciInstall: 'yarn install --immutable',
                lockfile: 'yarn.lock',
            },
            pnpm: {
                runScript: 'pnpm',
                install: 'pnpm install',
                ciInstall: 'pnpm install --frozen-lockfile',
                lockfile: 'pnpm-lock.yaml',
            },
            bun: {
                runScript: 'bun run',
                install: 'bun install',
                ciInstall: 'bun install --frozen-lockfile',
                lockfile: 'bun.lock',
            },
        };
        for (const pm of Object.keys(expected) as PackageManager[]) {
            const info = getPackageManagerInfo(pm);
            expect(info.name).toBe(pm);
            expect(info.runScript).toBe(expected[pm].runScript);
            expect(info.install).toBe(expected[pm].install);
            expect(info.ciInstall).toBe(expected[pm].ciInstall);
            expect(info.lockfile).toBe(expected[pm].lockfile);
        }
    });

    it('builds workspace run commands in each manager’s syntax', () => {
        expect(getPackageManagerInfo('npm').workspaceScript('server', 'dev')).toBe('npm run dev -w server');
        expect(getPackageManagerInfo('yarn').workspaceScript('server', 'dev')).toBe('yarn workspace server dev');
        expect(getPackageManagerInfo('pnpm').workspaceScript('server', 'dev')).toBe('pnpm --filter server dev');
        expect(getPackageManagerInfo('bun').workspaceScript('server', 'dev')).toBe('bun run --filter server dev');
    });

    it('flags pnpm as needing pnpm-workspace.yaml rather than the package.json workspaces field', () => {
        expect(getPackageManagerInfo('npm').usesPackageJsonWorkspaces).toBe(true);
        expect(getPackageManagerInfo('yarn').usesPackageJsonWorkspaces).toBe(true);
        expect(getPackageManagerInfo('bun').usesPackageJsonWorkspaces).toBe(true);
        expect(getPackageManagerInfo('pnpm').usesPackageJsonWorkspaces).toBe(false);
    });
});

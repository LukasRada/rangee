const esbuild = require('esbuild');
esbuild
    .build({
        entryPoints: ['./src/index.ts'],
        outfile: 'lib/index.js',
        bundle: true,
        minify: false,
        format: 'cjs',
        platform: 'node',
        
    })
    .catch(() => process.exit(1));

esbuild
    .build({
        entryPoints: ['./src/index.ts'],
        outfile: 'lib/index.mjs',
        bundle: true,
        minify: false,
        format: 'esm',
        platform: 'node',
    })
    .catch(() => process.exit(1));

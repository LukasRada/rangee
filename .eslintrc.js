// Temp fix for import.
// https://github.com/benmosher/eslint-plugin-import/issues/1285#issuecomment-466212438
const jsExtensions = ['.js'];
const tsExtensions = ['.ts'];
const allExtensions = jsExtensions.concat(tsExtensions);

module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
            modules: true,
        },
        project: './tsconfig.eslint.json',
    },
    plugins: ['@typescript-eslint', 'prettier'],
    extends: ['airbnb-base', 'plugin:@typescript-eslint/recommended', 'prettier'],
    settings: {
        'import/extensions': allExtensions,
        'import/parsers': {
            '@typescript-eslint/parser': tsExtensions,
        },
        'import/resolver': {
            node: {
                extensions: allExtensions,
            },
        },
    },
    // Este rules.
    rules: {
        // I believe type is enforced by callers.
        '@typescript-eslint/explicit-function-return-type': 'off',
        // Temp fix for import.
        // https://github.com/benmosher/eslint-plugin-import/issues/1285#issuecomment-466212438
        'import/named': 'off',
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'never',
                jsx: 'never',
                ts: 'never',
                tsx: 'never',
            },
        ],
        // Enforce arrow functions only is afaik not possible. But this helps.
        'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
        // I believe shadowing is a nice language feature.
        'no-shadow': 'off',
        'import/order': 'off',
        // Does not work with TypeScript export type.
        'import/prefer-default-export': 'off',
        // They are fine sometimes.
        'no-nested-ternary': 'off',
        // This is fine.
        'class-methods-use-this': 'off',
        'lines-between-class-members': 'off',
        // We use it for immer. It should be checked by readonly anyway.
        'no-param-reassign': 'off',
        // Irrelevant.
        'no-plusplus': 'off',
        'no-return-assign': 'off',
        'consistent-return': 'off',
        'max-classes-per-file': 'off',
        'no-console': 'warn',
        // TSC checks it.
        '@typescript-eslint/no-unused-vars': 'off',
        'no-undef': 'off',
        'no-useless-constructor': 'off',
        'no-empty-function': ['error', { allow: ['constructors'] }],
        // Reconsider, maybe enable later:
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/no-cycle': 'off',
        'prettier/prettier': 'error',
        'prefer-destructuring': ['error', { object: false, array: false }],
        '@typescript-eslint/no-non-null-assertion': 'off',
        'import/no-unresolved': 'off',
        'no-lonely-if': 'off',
    },
};

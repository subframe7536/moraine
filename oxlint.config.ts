import { subfLint, unocss } from '@subf/config/oxlint'

export default subfLint({
  solid: true,
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        // Lazy accessors (useRecipe `data`, `own`, `enforced`) may reference later declarations;
        // same-scope reads before the declaration are still reported.
        'no-use-before-define': ['error', { classes: false, functions: false, variables: false }],
        // Library dev-mode diagnostics legitimately use console.warn / console.error.
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        // Valibot's official idiomatic import is `import * as v from 'valibot'`.
        'import/no-namespace': ['error', { ignore: ['valibot'] }],
        // Public `*Base {}` and `MoraineTypeConfig {}` interfaces are intentional augmentation targets.
        'typescript/no-empty-object-type': ['error', { allowInterfaces: 'always' }],
        'subf/solid-reactivity': [
          'warn',
          {
            customReactiveFunctions: [
              'bindElement',
              'publishElement',
              'bindSelectableItemHandlers',
              'settle',
              'attachEventListener',
              'callRef',
              // Workaround: @subf/oxlint-plugin@0.4.0 omits queueMicrotask from async callbacks.
              'queueMicrotask',
            ],
          },
        ],
      },
    },
    {
      // Workaround: @subf/config@0.6.0 vitest.files uses extglob `?([cm])[jt]s?(x)` which
      // oxlint's globset does not match. Remove once @subf/config uses `{ts,tsx,mts,cts}`.
      files: ['**/*.{test,spec}.{ts,tsx,mts,cts}'],
      rules: {
        'no-unused-expressions': 'off',
        'subf/solid-reactivity': 'off',
        'typescript/no-explicit-any': 'off',
        'typescript/no-non-null-assertion': 'off',
        'unicorn/consistent-function-scoping': 'off',
      },
    },
    {
      // Type-only fixture files assert @ts-expect-error on invalid JSX namespaces and
      // module-scope signals; they are never executed at runtime.
      files: ['test/types-*/**/*.{ts,tsx}'],
      rules: {
        'subf/solid-no-unknown-namespaces': 'off',
        'subf/solid-no-module-scope-reactive-primitive': 'off',
        'typescript/no-explicit-any': 'off',
        'typescript/no-non-null-assertion': 'off',
      },
    },
    {
      ...unocss,
      rules: {
        ...unocss.rules,
        'uno/order': [
          'warn',
          {
            unoFunctions: ['cn', 'cva', 'defineRecipe'],
            unoVariables: ['^cls', 'classNames?$', '_CLASS$'],
          },
        ],
      },
    },
  ],
  options: {
    typeAware: true,
  },
  jsPlugins: [
    {
      name: 'moraine',
      specifier: './build/oxlint-plugin-moraine.ts',
    },
  ],
  rules: {
    'typescript/unbound-method': 'off',
    'moraine/no-slots-class-style-in-jsx': 'error',
    'moraine/data-attributes-in-slot-binding': 'error',
    'moraine/slot-binding-order': 'error',
    'moraine/require-create-effect-on': 'error',
    'moraine/ref-callback-assign-only': 'error',
    'moraine/no-emitted-extensions-in-imports': 'error',
    'moraine/no-string-style-prop': 'error',
    'moraine/no-direct-component-call': 'error',
    'moraine/no-re-export': 'error',
    'moraine/no-default-param-render-children': 'warn',
  },
})

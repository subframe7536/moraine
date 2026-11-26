import { subfLint } from '@subf/config/oxlint'

export default subfLint({
  solid: true,
  unocss: {
    order: {
      unoFunctions: ['cn', 'cva', 'defineRecipe'],
      unoVariables: ['^cls', 'classNames?$', '_CLASS$'],
    },
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
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
              'queueMicrotask',
            ],
          },
        ],
      },
    },
    {
      files: ['**/*.{test,spec}.{ts,tsx,mts,cts}'],
      plugins: ['vitest'],
      rules: {
        'subf/solid-reactivity': 'off',
        'unicorn/consistent-function-scoping': 'off',
        'vitest/require-mock-type-parameters': 'off',
        'vitest/valid-expect': ['error', { maxArgs: 2 }],
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

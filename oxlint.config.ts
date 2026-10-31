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
        // Element bindings take accessors and track them in their own effect.
        'subf/solid-reactivity': [
          'warn',
          { customReactiveFunctions: ['bindElement', 'publishElement'] },
        ],
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
    'moraine/no-emitted-extensions-in-imports': 'error',
    'moraine/no-string-style-prop': 'error',
    'moraine/no-direct-component-call': 'error',
    'moraine/no-re-export': 'error',
  },
})

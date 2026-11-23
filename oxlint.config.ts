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
        // Disabled: @subf/oxlint-plugin models the Solid 1 tracked-scope API (its createEffect /
        // createSelector branches only mark the first argument), so the Solid 2
        // createEffect(compute, apply) signature is always misreported. Re-enable once the plugin
        // understands Solid 2 signatures.
        'subf/solid-reactivity': 'off',
        // Disabled: the rule enforces Solid 1 import locations — it rewrites store APIs
        // (`createStore`, `reconcile`) to the `solid-js/store` subpath, which does not
        // exist in Solid 2 where they are exported from the main `solid-js` entry.
        'subf/solid-imports': 'off',
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

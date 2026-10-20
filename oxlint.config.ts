import { subfLint, unocss } from '@subf/config/oxlint'

export default subfLint({
  solid: true,
  overrides: [
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
    'moraine/inline-data-attributes-in-jsx': 'error',
    'moraine/require-create-effect-on': 'error',
    'moraine/no-emitted-extensions-in-imports': 'error',
    'moraine/no-string-style-prop': 'error',
    'moraine/no-direct-component-call': 'error',
    'moraine/no-re-export': 'error',
  },
})

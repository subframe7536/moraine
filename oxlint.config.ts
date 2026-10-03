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
  rules: {
    'typescript/unbound-method': 'off',
  },
})

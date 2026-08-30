import { subfLint } from '@subf/config/oxlint'

export default subfLint({
  solid: true,
  unocss: true,
  options: {
    typeAware: true,
  },
  rules: {
    'typescript/unbound-method': 'off',
  },
})

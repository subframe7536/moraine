import { subfLint } from '@subf/config/oxlint'

export default subfLint(
  {
    solid: true,
    unocss: {
      order: {
        unoFunctions: ['cn', 'defineRecipe'],
        unoVariables: ['_CLASS$'],
      },
    },
    options: {
      typeAware: true,
    },
  },
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
  },
)

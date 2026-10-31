import { Icon } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function IconPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'input',
          prop: 'fontSize',
          label: 'Font size (px)',
          defaultValue: 24,
          inputType: 'number',
        },
        {
          kind: 'input',
          prop: 'name',
          label: 'Icon identifier',
          defaultValue: 'i-lucide-sparkles',
        },
      ]}
    >
      {(props) => (
        <div
          class="flex items-center justify-center"
          style={{ 'font-size': `${props.fontSize}px` }}
        >
          <Icon name={props.name} />
        </div>
      )}
    </DocsPlayground>
  )
}

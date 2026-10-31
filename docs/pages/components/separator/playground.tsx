import { Separator } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function SeparatorPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'orientation',
          label: 'Orientation',
          defaultValue: 'horizontal',
          options: [
            { label: 'Horizontal', value: 'horizontal' },
            { label: 'Vertical', value: 'vertical' },
          ],
        },
      ]}
    >
      {(props) => (
        <div class={`flex gap-4 ${props.orientation === 'vertical' ? 'h-4' : 'flex-col'}`}>
          <div class="text-xs text-muted-foreground">Section Header</div>
          <Separator orientation={props.orientation} />
          <div class="text-xs text-muted-foreground">Content Section</div>
        </div>
      )}
    </DocsPlayground>
  )
}

import { KbdGroup } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function KbdGroupPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'default',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Outline', value: 'outline' },
            { label: 'Invert', value: 'invert' },
          ],
        },
      ]}
    >
      {(props) => (
        <div class="flex gap-2 items-center">
          <span class="text-xs text-muted-foreground">Quick save:</span>
          <KbdGroup items={['ctrl', 'shift', 'S']} size={props.size} variant={props.variant} />
        </div>
      )}
    </DocsPlayground>
  )
}

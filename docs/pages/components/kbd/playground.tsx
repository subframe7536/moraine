import { Kbd } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function KbdPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'value',
          label: 'Key',
          defaultValue: 'meta',
          options: [
            { label: 'Command / Meta', value: 'meta' },
            { label: 'Control', value: 'ctrl' },
            { label: 'Shift', value: 'shift' },
            { label: 'Alt / Option', value: 'alt' },
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
        { kind: 'switch', prop: 'symbol', label: 'Resolve symbol', defaultValue: true },
      ]}
    >
      {(props) => (
        <div class="flex gap-2 items-center">
          <span class="text-xs text-muted-foreground">Press</span>
          <Kbd
            value={props.value}
            variant={props.variant}
            size={props.size}
            symbol={props.symbol}
          />
          <Kbd value="K" variant={props.variant} size={props.size} />
          <span class="text-xs text-muted-foreground">to open command menu</span>
        </div>
      )}
    </DocsPlayground>
  )
}

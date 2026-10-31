import { CopyButton } from '@src'
import { Show } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function CopyButtonPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'ghost',
          options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Soft', value: 'soft' },
            { label: 'Outline', value: 'outline' },
            { label: 'Ghost', value: 'ghost' },
          ],
        },
        {
          kind: 'select',
          prop: 'tone',
          label: 'Tone',
          defaultValue: 'neutral',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Neutral', value: 'neutral' },
            { label: 'Danger', value: 'danger' },
            { label: 'Info', value: 'info' },
            { label: 'Success', value: 'success' },
            { label: 'Warning', value: 'warning' },
          ],
        },
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Extra Small', value: 'xs' },
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
            { label: 'Extra Large', value: 'xl' },
          ],
        },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        {
          kind: 'select',
          prop: 'iconPosition',
          label: 'Icon Position',
          defaultValue: 'leading',
          options: [
            { label: 'Leading', value: 'leading' },
            { label: 'Trailing', value: 'trailing' },
          ],
        },
        { kind: 'switch', prop: 'label', label: 'Label', defaultValue: true },
      ]}
    >
      {(props) => (
        <CopyButton
          value="pnpm add moraine"
          variant={props.variant}
          tone={props.tone}
          size={props.size}
          disabled={props.disabled}
          iconPosition={props.iconPosition}
        >
          <Show when={props.label}>Copy snippet</Show>
        </CopyButton>
      )}
    </DocsPlayground>
  )
}

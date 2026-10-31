import { ToggleButton } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function ToggleButtonPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Unpressed variant',
          defaultValue: 'ghost',
          options: [
            { label: 'Ghost', value: 'ghost' },
            { label: 'Solid', value: 'solid' },
            { label: 'Soft', value: 'soft' },
            { label: 'Outline', value: 'outline' },
            { label: 'Link', value: 'link' },
          ],
        },
        {
          kind: 'select',
          prop: 'activeVariant',
          label: 'Pressed variant',
          defaultValue: 'soft',
          options: [
            { label: 'Soft', value: 'soft' },
            { label: 'Solid', value: 'solid' },
            { label: 'Outline', value: 'outline' },
            { label: 'Ghost', value: 'ghost' },
            { label: 'Link', value: 'link' },
          ],
        },
        {
          kind: 'select',
          prop: 'tone',
          label: 'Unpressed tone',
          defaultValue: 'neutral',
          options: [
            { label: 'Neutral', value: 'neutral' },
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Danger', value: 'danger' },
            { label: 'Info', value: 'info' },
            { label: 'Success', value: 'success' },
            { label: 'Warning', value: 'warning' },
          ],
        },
        {
          kind: 'select',
          prop: 'activeTone',
          label: 'Pressed tone',
          defaultValue: 'neutral',
          options: [
            { label: 'Neutral', value: 'neutral' },
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
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
            { label: 'Extra small', value: 'xs' },
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
            { label: 'Extra large', value: 'xl' },
          ],
        },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        { kind: 'switch', prop: 'loading', label: 'Loading', defaultValue: false },
      ]}
    >
      {(props) => (
        <ToggleButton
          variant={props.variant}
          activeVariant={props.activeVariant}
          tone={props.tone}
          activeTone={props.activeTone}
          size={props.size}
          disabled={props.disabled}
          loading={props.loading}
          leading="i-lucide:bold"
        >
          {(state) => <span class={state.pressed ? 'font-semibold' : undefined}>Bold</span>}
        </ToggleButton>
      )}
    </DocsPlayground>
  )
}

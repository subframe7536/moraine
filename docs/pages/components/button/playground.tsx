import { Button } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function ButtonPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'solid',
          options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Soft', value: 'soft' },
            { label: 'Outline', value: 'outline' },
            { label: 'Ghost', value: 'ghost' },
            { label: 'Link', value: 'link' },
          ],
        },
        {
          kind: 'select',
          prop: 'tone',
          label: 'Tone',
          defaultValue: 'primary',
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
        { kind: 'switch', prop: 'loading', label: 'Loading', defaultValue: false },
        {
          kind: 'select',
          prop: 'activeEffect',
          label: 'Active effect',
          defaultValue: 'move-down',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Move down', value: 'move-down' },
            { label: 'Zoom in', value: 'zoom-in' },
          ],
        },
      ]}
    >
      {(props) => (
        <Button
          variant={props.variant}
          tone={props.tone}
          size={props.size}
          disabled={props.disabled}
          loading={props.loading}
          activeEffect={props.activeEffect}
          leading="i-lucide:rocket"
          trailing="icon-arrow-right"
        >
          Deploy Project
        </Button>
      )}
    </DocsPlayground>
  )
}

import { Badge } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function BadgePlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'soft',
          options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Soft', value: 'soft' },
            { label: 'Subtle', value: 'subtle' },
            { label: 'Outline', value: 'outline' },
          ],
        },
        {
          kind: 'select',
          prop: 'tone',
          label: 'Tone',
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
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
      ]}
    >
      {(props) => (
        <Badge
          variant={props.variant}
          tone={props.tone}
          size={props.size}
          leading="i-lucide:sparkles"
        >
          New feature
        </Badge>
      )}
    </DocsPlayground>
  )
}

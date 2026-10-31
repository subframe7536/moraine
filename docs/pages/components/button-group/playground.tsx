import { Button, ButtonGroup } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function ButtonGroupPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'outline',
          options: [
            { label: 'Outline', value: 'outline' },
            { label: 'Solid', value: 'solid' },
            { label: 'Soft', value: 'soft' },
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
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
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
        <ButtonGroup
          variant={props.variant}
          tone={props.tone}
          size={props.size}
          orientation={props.orientation}
          aria-label="Document history"
        >
          <Button leading="i-lucide:undo-2">Undo</Button>
          <Button leading="i-lucide:redo-2">Redo</Button>
        </ButtonGroup>
      )}
    </DocsPlayground>
  )
}

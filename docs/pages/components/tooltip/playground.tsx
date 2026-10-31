import { Button, Tooltip } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function TooltipPlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'input', prop: 'text', label: 'Tooltip text', defaultValue: 'Create new document' },
        {
          kind: 'select',
          prop: 'placement',
          label: 'Placement',
          defaultValue: 'top',
          options: [
            { label: 'Top', value: 'top' },
            { label: 'Bottom', value: 'bottom' },
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
        },
        {
          kind: 'select',
          prop: 'align',
          label: 'Align',
          defaultValue: 'center',
          options: [
            { label: 'Start', value: 'start' },
            { label: 'Center', value: 'center' },
            { label: 'End', value: 'end' },
          ],
        },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        { kind: 'switch', prop: 'invert', label: 'Invert colors', defaultValue: false },
      ]}
    >
      {(props) => (
        <div class="p-6 flex items-center justify-center">
          <Tooltip
            placement={props.placement}
            align={props.align}
            disabled={props.disabled}
            invert={props.invert}
          >
            <Tooltip.Trigger as={Button} variant="outline" leading="i-lucide:file-plus">
              Hover me
            </Tooltip.Trigger>
            <Tooltip.Content text={props.text} kbds={['⌘', 'N']} />
          </Tooltip>
        </div>
      )}
    </DocsPlayground>
  )
}

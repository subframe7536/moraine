import { Button, Field, Input, Popover } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function PopoverPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'placement',
          label: 'Placement',
          defaultValue: 'bottom',
          options: [
            { label: 'Bottom', value: 'bottom' },
            { label: 'Top', value: 'top' },
            { label: 'Right', value: 'right' },
            { label: 'Left', value: 'left' },
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
        { kind: 'switch', prop: 'dismissible', label: 'Dismissible', defaultValue: true },
      ]}
    >
      {(props) => (
        <Popover
          placement={props.placement}
          align={props.align}
          disabled={props.disabled}
          dismissible={props.dismissible}
        >
          <Popover.Trigger as={Button} variant="outline" size="sm">
            Adjust dimensions
          </Popover.Trigger>
          <Popover.Content>
            <div class="p-4 w-72 space-y-3">
              <h4 class="text-xs text-foreground font-semibold">Dimensions & Scale</h4>
              <div class="space-y-2">
                <Field label="Width" orientation="horizontal">
                  <Input size="sm" defaultValue="100%" />
                </Field>
                <Field label="Max height" orientation="horizontal">
                  <Input size="sm" defaultValue="300px" />
                </Field>
              </div>
            </div>
          </Popover.Content>
        </Popover>
      )}
    </DocsPlayground>
  )
}

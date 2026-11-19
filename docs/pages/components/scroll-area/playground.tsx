import { ScrollArea } from '@src'
import { For } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function ScrollAreaPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'orientation',
          label: 'Orientation',
          defaultValue: 'vertical',
          options: [
            { label: 'Vertical', value: 'vertical' },
            { label: 'Horizontal', value: 'horizontal' },
            { label: 'Both', value: 'both' },
          ],
        },
        {
          kind: 'select',
          prop: 'scrollbarVariant',
          label: 'Scrollbar',
          defaultValue: 'hover',
          options: [
            { label: 'Hover', value: 'hover' },
            { label: 'Always', value: 'always' },
            { label: 'Scroll', value: 'scroll' },
            { label: 'Native', value: 'native' },
            { label: 'Hidden', value: 'hidden' },
          ],
        },
        {
          kind: 'select',
          prop: 'scrollbarWidth',
          label: 'Scrollbar width',
          defaultValue: 'normal',
          options: [
            { label: 'Normal', value: 'normal' },
            { label: 'Thin', value: 'thin' },
          ],
        },
        { kind: 'switch', prop: 'shadow', label: 'Edge shadows', defaultValue: true },
        {
          kind: 'input',
          prop: 'shadowSize',
          label: 'Shadow size (px)',
          defaultValue: 40,
          inputType: 'number',
        },
        {
          kind: 'input',
          prop: 'scrollThreshold',
          label: 'Scroll threshold (px)',
          defaultValue: 0,
          inputType: 'number',
        },
      ]}
    >
      {(props) => (
        <ScrollArea
          orientation={props.orientation}
          scrollbarVariant={props.scrollbarVariant}
          scrollbarWidth={props.scrollbarWidth}
          shadow={props.shadow}
          shadowSize={props.shadowSize}
          scrollThreshold={props.scrollThreshold}
          class="h-48 max-w-lg w-full"
          classes={{
            content: `flex gap-3 ${props.orientation === 'vertical' ? 'flex-col pe-3' : 'items-start pb-3'}`,
          }}
          role="region"
          aria-label="Activity playground"
        >
          <For each={Array.from({ length: 12 }, (_, index) => index + 1)}>
            {(entry) => (
              <div
                class={`py-1.5 shrink-0 ${props.orientation === 'vertical' ? '' : 'w-40'}  ${props.orientation === 'both' ? 'h-64' : ''}`}
              >
                <p class="text-sm font-medium">Activity entry {entry}</p>
                <p class="text-xs text-muted-foreground">Project updates and decisions.</p>
              </div>
            )}
          </For>
        </ScrollArea>
      )}
    </DocsPlayground>
  )
}

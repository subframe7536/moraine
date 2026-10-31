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
          ],
        },
        { kind: 'switch', prop: 'shadow', label: 'Edge shadows', defaultValue: true },
        { kind: 'switch', prop: 'hideScrollbar', label: 'Hide scrollbar', defaultValue: false },
        {
          kind: 'input',
          prop: 'shadowSize',
          label: 'Shadow size (px)',
          defaultValue: 40,
          inputType: 'number',
        },
        {
          kind: 'input',
          prop: 'offset',
          label: 'Edge offset (px)',
          defaultValue: 0,
          inputType: 'number',
        },
      ]}
    >
      {(props) => (
        <div class="max-w-lg w-full">
          <ScrollArea
            orientation={props.orientation}
            shadow={props.shadow}
            hideScrollbar={props.hideScrollbar}
            shadowSize={props.shadowSize}
            offset={props.offset}
            class="h-48"
            role="region"
            aria-label="Activity playground"
          >
            <div
              class={`flex ${
                props.orientation === 'horizontal'
                  ? 'items-start gap-3 pb-2'
                  : 'flex-col gap-1 pr-3'
              }`}
            >
              <For each={Array.from({ length: 12 }, (_, index) => index + 1)}>
                {(entry) => (
                  <div
                    class={`py-1.5 shrink-0 ${props.orientation === 'horizontal' ? 'w-40' : ''}`}
                  >
                    <p class="text-sm font-medium">Activity entry {entry}</p>
                    <p class="text-xs text-muted-foreground">Project updates and decisions.</p>
                  </div>
                )}
              </For>
            </div>
          </ScrollArea>
        </div>
      )}
    </DocsPlayground>
  )
}

import { Resizable } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function ResizablePlayground() {
  return (
    <DocsPlayground
      controls={[
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
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
      ]}
    >
      {(props) => (
        <div class="border border-border rounded-xl h-64 max-w-xl w-full overflow-hidden">
          <Resizable
            orientation={props.orientation}
            disabled={props.disabled}
            defaultValue={['35%', '65%']}
          >
            <Resizable.Panel min="20%">
              <div class="p-4 flex flex-col h-full justify-between">
                <div class="space-y-1">
                  <div class="text-xs font-medium">Navigation Rail</div>
                  <div class="text-xs text-muted-foreground">
                    Draggable boundary with a minimum.
                  </div>
                </div>
                <span class="text-xs text-muted-foreground font-mono">min="20%"</span>
              </div>
            </Resizable.Panel>
            <Resizable.Handle />
            <Resizable.Panel min="30%">
              <div class="p-4 flex flex-col h-full justify-between">
                <div class="space-y-1">
                  <div class="text-xs font-medium">Workspace Viewport</div>
                  <div class="text-xs text-muted-foreground">
                    Grows and shrinks as the handle moves.
                  </div>
                </div>
                <span class="text-xs text-muted-foreground font-mono">min="30%"</span>
              </div>
            </Resizable.Panel>
          </Resizable>
        </div>
      )}
    </DocsPlayground>
  )
}

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
        <div class="border border-border/60 rounded-xl bg-card/30 h-64 max-w-xl w-full shadow-xs overflow-hidden">
          <Resizable
            orientation={props.orientation}
            disabled={props.disabled}
            defaultValue={['35%', '65%']}
          >
            <Resizable.Panel min="20%" class="p-4 bg-muted/25 flex flex-col justify-between">
              <div class="space-y-1">
                <div class="text-xs text-foreground font-medium">Navigation Rail</div>
                <div class="text-[11px] text-muted-foreground leading-relaxed">
                  Draggable boundary with min constraint.
                </div>
              </div>
              <span class="text-[10px] text-muted-foreground/80 font-mono">min="20%"</span>
            </Resizable.Panel>
            <Resizable.Handle />
            <Resizable.Panel min="30%" class="p-4 bg-background/50 flex flex-col justify-between">
              <div class="space-y-1">
                <div class="text-xs text-foreground font-medium">Workspace Viewport</div>
                <div class="text-[11px] text-muted-foreground leading-relaxed">
                  Expands or shrinks dynamically as adjacent handles move.
                </div>
              </div>
              <span class="text-[10px] text-muted-foreground/80 font-mono">min="30%"</span>
            </Resizable.Panel>
          </Resizable>
        </div>
      )}
    </DocsPlayground>
  )
}

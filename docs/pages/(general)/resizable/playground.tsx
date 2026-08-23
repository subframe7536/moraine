import { Resizable } from '@src'

export interface ResizablePlaygroundProps {
  handle?: boolean
  disabled?: boolean
}

export function ResizablePlayground(props: ResizablePlaygroundProps) {
  return (
    <div class="border border-border/60 rounded-xl bg-card/30 h-48 max-w-xl w-full overflow-hidden">
      <Resizable
        handle={props.handle ?? true}
        disable={props.disabled ?? false}
        panels={[
          {
            defaultSize: '35%',
            min: '20%',
            content: (
              <div class="text-xs text-muted-foreground font-mono p-4 bg-muted/20 flex h-full items-center justify-center">
                Sidebar Panel
              </div>
            ),
          },
          {
            defaultSize: '65%',
            min: '30%',
            content: (
              <div class="text-xs text-muted-foreground font-mono p-4 bg-background/50 flex h-full items-center justify-center">
                Main Editor Content
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

import { Resizable } from '@src'

export function Constraints() {
  return (
    <div class="b-(1 border) rounded-xl h-40 w-full overflow-hidden">
      <Resizable
        panels={[
          {
            defaultSize: '30%',
            min: '20%',
            max: '50%',
            content: (
              <div class="text-xs text-muted-foreground p-4 bg-muted/20 flex h-full items-center justify-center">
                Sidebar (20% - 50%)
              </div>
            ),
          },
          {
            content: (
              <div class="text-xs text-muted-foreground p-4 flex h-full items-center justify-center">
                Main content area
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

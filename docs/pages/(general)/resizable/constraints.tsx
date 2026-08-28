import { Resizable } from '@src'

export function Constraints() {
  return (
    <div class="b-(1 border) rounded-xl h-40 w-full overflow-hidden">
      <Resizable
        items={[
          {
            defaultSize: 30,
            minSize: 20,
            maxSize: 50,
            children: (
              <div class="text-xs text-muted-foreground p-4 bg-muted/20 flex h-full items-center justify-center">
                Sidebar (20% - 50%)
              </div>
            ),
          },
          {
            children: (
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

import { Resizable } from '@src'

export function Composition() {
  return (
    <div class="b-(1 border) rounded-xl h-48 w-full overflow-hidden">
      <Resizable
        items={[
          {
            defaultSize: 35,
            children: (
              <div class="text-xs text-muted-foreground bg-muted/20 flex h-full items-center justify-center">
                Navigation
              </div>
            ),
          },
          {
            children: (
              <Resizable
                orientation="vertical"
                items={[
                  {
                    defaultSize: 60,
                    children: (
                      <div class="text-xs text-muted-foreground flex h-full items-center justify-center">
                        Editor workspace
                      </div>
                    ),
                  },
                  {
                    children: (
                      <div class="text-xs text-muted-foreground bg-muted/10 flex h-full items-center justify-center">
                        Terminal output
                      </div>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </div>
  )
}

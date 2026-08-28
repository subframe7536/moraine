import { Resizable } from '@src'

export function Composition() {
  return (
    <div class="b-(1 border) rounded-xl h-48 w-full overflow-hidden">
      <Resizable
        panels={[
          {
            defaultSize: '35%',
            content: (
              <div class="text-xs text-muted-foreground bg-muted/20 flex h-full items-center justify-center">
                Navigation
              </div>
            ),
          },
          {
            content: (
              <Resizable
                orientation="vertical"
                panels={[
                  {
                    defaultSize: '60%',
                    content: (
                      <div class="text-xs text-muted-foreground flex h-full items-center justify-center">
                        Editor workspace
                      </div>
                    ),
                  },
                  {
                    content: (
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

import { MoraineProvider, ScrollArea } from '@src'
import { defineTheme } from '@src/theme'
import { For } from 'solid-js'

const theme = defineTheme({
  scrollArea: {
    defaultVariants: { shadow: true, hideScrollbar: true },
    base: {
      '--scroll-area-shadow-size': '24px',
      '--scroll-area-shadow-start': 'transparent, black calc(var(--scroll-area-shadow-size) * 1.5)',
      '--scroll-area-shadow-end':
        'black calc(100% - var(--scroll-area-shadow-size) * 1.5), transparent',
    },
  },
})

export function Theme() {
  return (
    <MoraineProvider theme={theme}>
      <div class="gap-6 grid w-full sm:grid-cols-2">
        <For each={[undefined, 12]}>
          {(shadowSize) => (
            <div class="space-y-3">
              <p class="text-sm font-medium">
                {shadowSize === undefined ? 'Theme size: 24px' : 'Instance size: 12px'}
              </p>
              <ScrollArea
                shadowSize={shadowSize}
                class="h-48 space-y-1"
                role="region"
                aria-label={
                  shadowSize === undefined ? 'Theme defaults example' : 'Instance override example'
                }
              >
                <For each={Array.from({ length: 10 }, (_, index) => index + 1)}>
                  {(entry) => <p class="text-sm py-1.5">Project update {entry}</p>}
                </For>
              </ScrollArea>
            </div>
          )}
        </For>
      </div>
    </MoraineProvider>
  )
}

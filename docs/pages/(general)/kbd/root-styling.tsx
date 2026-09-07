import { Kbd, MoraineProvider } from '@src'
import { createDesign } from '@src/design.ts'

const design = createDesign({
  kbd: { base: { root: 'rounded-none' } },
})

export function RootStyling() {
  return (
    <div class="w-full space-y-6">
      <div class="space-y-2">
        <p class="text-sm text-muted-foreground">Instance class and style</p>
        <Kbd value="K" class="text-blue-600" style={{ 'border-radius': '8px' }} />
      </div>
      <MoraineProvider design={design}>
        <div class="space-y-2">
          <p class="text-sm text-muted-foreground">Local design defaults</p>
          <Kbd value="K" />
        </div>
      </MoraineProvider>
    </div>
  )
}

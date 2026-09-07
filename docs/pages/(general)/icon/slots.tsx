import { Icon, MoraineProvider } from '@src'
import { createDesign } from '@src/design.ts'

const design = createDesign({
  icon: { base: { root: 'text-emerald-600' } },
})

export function Slots() {
  return (
    <div class="w-full space-y-6">
      <div class="space-y-2">
        <p class="text-sm text-muted-foreground">Instance class and style</p>
        <Icon
          name="i-lucide:info"
          slotName="custom-icon"
          class="text-blue-500"
          style={{ width: '28px', height: '28px' }}
        />
      </div>
      <MoraineProvider design={design}>
        <div class="space-y-2">
          <p class="text-sm text-muted-foreground">Local design defaults</p>
          <Icon name="i-lucide:info" />
        </div>
      </MoraineProvider>
    </div>
  )
}

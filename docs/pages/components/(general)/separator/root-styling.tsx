import { Separator, MoraineProvider } from '@src'
import { defineTheme } from '@src/theme'

const theme = defineTheme({
  separator: { base: { root: 'bg-emerald-500' } },
})

export function RootStyling() {
  return (
    <div class="w-full space-y-6">
      <div class="space-y-2">
        <p class="text-muted-foreground text-sm">Instance class and style</p>
        <Separator class="bg-blue-500" style={{ height: '3px' }} />
      </div>
      <MoraineProvider theme={theme}>
        <div class="space-y-2">
          <p class="text-muted-foreground text-sm">Local Theme defaults</p>
          <Separator />
        </div>
      </MoraineProvider>
    </div>
  )
}

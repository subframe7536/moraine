import { Separator, MoraineProvider } from '@src'
import { createTheme } from '@src/theme.ts'

const theme = createTheme({
  separator: { base: { root: 'border-emerald-500' } },
})

export function RootStyling() {
  return (
    <div class="w-full space-y-6">
      <div class="space-y-2">
        <p class="text-sm text-muted-foreground">Instance class and style</p>
        <Separator class="border-blue-500" style={{ 'border-top-width': '3px' }} />
      </div>
      <MoraineProvider theme={theme}>
        <div class="space-y-2">
          <p class="text-sm text-muted-foreground">Local Theme defaults</p>
          <Separator />
        </div>
      </MoraineProvider>
    </div>
  )
}

import { Kbd, MoraineProvider } from '@src'
import { createTheme, defaultTheme } from '@src/theme.ts'

const theme = createTheme({
  extends: defaultTheme,
  kbd: { base: { root: 'rounded-none' } },
})

export function RootStyling() {
  return (
    <div class="w-full space-y-6">
      <div class="space-y-2">
        <p class="text-sm text-muted-foreground">Instance class and style</p>
        <Kbd value="K" class="text-blue-600" style={{ 'border-radius': '8px' }} />
      </div>
      <MoraineProvider theme={theme}>
        <div class="space-y-2">
          <p class="text-sm text-muted-foreground">Local Theme defaults</p>
          <Kbd value="K" />
        </div>
      </MoraineProvider>
    </div>
  )
}

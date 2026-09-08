import { Collapsible, MoraineProvider } from '@src'
import { createTheme } from '@src/theme.ts'

const theme = createTheme({
  collapsible: {
    base: {
      root: 'w-full rounded-lg border border-border',
      trigger: 'w-full px-4 py-3 text-left font-medium text-blue-600',
      contentWrapper: 'border-t border-border',
      content: 'p-4 text-sm text-muted-foreground',
    },
  },
})

export function DesignStyling() {
  return (
    <MoraineProvider theme={theme}>
      <Collapsible defaultOpen transition classes={{ trigger: 'text-emerald-600' }}>
        <Collapsible.Trigger style={{ 'letter-spacing': '0.02em' }}>
          Project details
        </Collapsible.Trigger>
        <Collapsible.Content class="text-foreground">
          Theme slots provide defaults; instance and child styles refine this disclosure.
        </Collapsible.Content>
      </Collapsible>
    </MoraineProvider>
  )
}

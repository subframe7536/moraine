import { ButtonGroup, MoraineProvider, ToggleButton } from '@src'
import { defineTheme } from '@src/theme'

const theme = defineTheme({
  toggleButton: {
    defaultVariants: { variant: 'outline', activeVariant: 'default', size: 'sm' },
  },
})

export function Theme() {
  return (
    <MoraineProvider theme={theme}>
      <div class="flex flex-wrap gap-4 items-center">
        <ToggleButton leading="i-lucide:bell">Notifications</ToggleButton>
        <ToggleButton leading="i-lucide:mail" activeVariant="secondary" defaultPressed>
          Email updates
        </ToggleButton>
        <ButtonGroup size="sm" variant="ghost" aria-label="Text formatting">
          <ToggleButton leading="i-lucide:bold" aria-label="Bold formatting" />
          <ToggleButton leading="i-lucide:italic" aria-label="Italic formatting" />
        </ButtonGroup>
      </div>
    </MoraineProvider>
  )
}

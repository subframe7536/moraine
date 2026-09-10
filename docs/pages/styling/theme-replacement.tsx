import { Button, Input, MoraineProvider } from '@src'
import { createTheme, defaultTheme } from '@src/theme'
import { createSignal } from 'solid-js'

const roundedTheme = defaultTheme
const squareTheme = createTheme({
  extends: defaultTheme,
  button: { variants: { size: { md: { root: 'rounded-none' } } } },
})

export function ThemeReplacement() {
  const [square, setSquare] = createSignal(false)
  let input: HTMLInputElement | undefined

  return (
    <div class="gap-3 grid max-w-md w-full">
      <Button variant="outline" onClick={() => setSquare((value) => !value)}>
        Switch Theme
      </Button>
      <MoraineProvider theme={square() ? squareTheme : roundedTheme}>
        <label for="theme-workspace-name">Preserved workspace name</label>
        <Input
          id="theme-workspace-name"
          defaultValue="Workspace"
          inputRef={(element) => (input = element)}
        />
        <Button onClick={() => input?.focus()}>Focus native input</Button>
      </MoraineProvider>
      <p class="text-sm text-muted-foreground">
        Type a workspace name, then switch Theme. The input keeps its value and native ref while the
        button shape changes.
      </p>
    </div>
  )
}

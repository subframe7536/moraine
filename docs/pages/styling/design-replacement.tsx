import { Button, Input, MoraineProvider } from '@src'
import { createDesign } from '@src/design.ts'
import { createSignal } from 'solid-js'

const roundedDesign = createDesign()
const squareDesign = createDesign({
  button: { variants: { size: { md: { root: 'rounded-none' } } } },
})

export function DesignReplacement() {
  const [square, setSquare] = createSignal(false)
  let input: HTMLInputElement | undefined

  return (
    <div class="gap-3 grid max-w-md w-full">
      <Button variant="outline" onClick={() => setSquare((value) => !value)}>
        Switch Design
      </Button>
      <MoraineProvider design={square() ? squareDesign : roundedDesign}>
        <label for="design-workspace-name">Preserved workspace name</label>
        <Input
          id="design-workspace-name"
          defaultValue="Workspace"
          inputRef={(element) => (input = element)}
        />
        <Button onClick={() => input?.focus()}>Focus native input</Button>
      </MoraineProvider>
      <p class="text-sm text-muted-foreground">
        Type a workspace name, then switch Design. The input keeps its value and native ref while
        the button shape changes.
      </p>
    </div>
  )
}

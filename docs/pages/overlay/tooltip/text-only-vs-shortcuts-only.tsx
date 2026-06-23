import { Button, Switch, Tooltip } from '@src'
import { createSignal } from 'solid-js'

export function TextOnlyVsShortcutsOnly() {
  const [invert, setInvert] = createSignal(false)

  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Tooltip invert={invert()} text="Just a message">
        <Button variant="outline">Text only</Button>
      </Tooltip>
      <Tooltip invert={invert()} kbds={['Ctrl', 'Shift', 'P']}>
        <Button variant="outline">Shortcuts only</Button>
      </Tooltip>
      <Tooltip invert={invert()} text="Command palette" kbds={['Ctrl', 'Shift', 'P']}>
        <Button variant="outline">Both</Button>
      </Tooltip>
      <Switch checked={invert()} onChange={setInvert} label="Invert" />
    </div>
  )
}

import { Button, Switch, Tooltip } from '@src'
import { createSignal } from 'solid-js'

export function TextOnlyVsShortcutsOnly() {
  const [invert, setInvert] = createSignal(false)

  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Tooltip invert={invert()} text="Just a message">
        {(props) => (
          <Button {...props} variant="outline">
            Text only
          </Button>
        )}
      </Tooltip>
      <Tooltip invert={invert()} kbds={['Ctrl', 'Shift', 'P']}>
        {(props) => (
          <Button {...props} variant="outline">
            Shortcuts only
          </Button>
        )}
      </Tooltip>
      <Tooltip invert={invert()} text="Command palette" kbds={['Ctrl', 'Shift', 'P']}>
        {(props) => (
          <Button {...props} variant="outline">
            Both
          </Button>
        )}
      </Tooltip>
      <Switch checked={invert()} onChange={setInvert} label="Invert" />
    </div>
  )
}

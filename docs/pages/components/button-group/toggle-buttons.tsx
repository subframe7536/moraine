import { ButtonGroup, ToggleButton } from '@src'

export function ToggleButtons() {
  return (
    <ButtonGroup size="sm" aria-label="Text formatting">
      <ToggleButton leading="i-lucide:bold" defaultPressed>
        Bold
      </ToggleButton>
      <ToggleButton leading="i-lucide:italic">Italic</ToggleButton>
      <ToggleButton leading="i-lucide:underline">Underline</ToggleButton>
    </ButtonGroup>
  )
}

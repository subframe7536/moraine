import { Button, ButtonGroup } from '@src'

export function SeparatorExample() {
  return (
    <ButtonGroup aria-label="Clipboard actions">
      <Button variant="secondary">Copy</Button>
      <ButtonGroup.Separator />
      <Button variant="secondary">Paste</Button>
    </ButtonGroup>
  )
}

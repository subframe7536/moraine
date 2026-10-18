import { Button, ButtonGroup } from '@src'

export function SeparatorExample() {
  return (
    <ButtonGroup variant="soft" tone="neutral" aria-label="Clipboard actions">
      <Button>Copy</Button>
      <ButtonGroup.Separator />
      <Button>Paste</Button>
    </ButtonGroup>
  )
}

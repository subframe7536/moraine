import { Button, ButtonGroup } from '@src'

export function Basic() {
  return (
    <ButtonGroup variant="outline" aria-label="Document history">
      <Button leading="i-lucide:undo-2">Undo</Button>
      <Button leading="i-lucide:redo-2">Redo</Button>
    </ButtonGroup>
  )
}

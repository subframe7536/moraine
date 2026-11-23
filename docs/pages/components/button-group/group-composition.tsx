import { Button, ButtonGroup } from '@src'
export function GroupComposition() {
  return (
    <ButtonGroup variant="outline" aria-label="Document actions">
      <Button>Copy link</Button>
      <Button>Duplicate</Button>
      <Button>Archive</Button>
    </ButtonGroup>
  )
}

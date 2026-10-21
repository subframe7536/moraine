import { Button, ButtonGroup } from '@src'

export function GroupComposition() {
  return (
    <div class="flex flex-col gap-4 items-start">
      <ButtonGroup>
        <Button variant="outline">Copy link</Button>
        <Button variant="outline">Duplicate</Button>
        <Button variant="outline">Archive</Button>
      </ButtonGroup>
    </div>
  )
}

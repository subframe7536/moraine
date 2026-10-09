import { Button, ButtonGroup } from '@src'

export function Vertical() {
  return (
    <ButtonGroup orientation="vertical" variant="outline" aria-label="Zoom">
      <Button size="icon-md" leading="i-lucide:plus" aria-label="Zoom in" />
      <ButtonGroup.Separator />
      <Button size="icon-md" leading="i-lucide:minus" aria-label="Zoom out" />
    </ButtonGroup>
  )
}

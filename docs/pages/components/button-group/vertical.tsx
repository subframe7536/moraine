import { Button, ButtonGroup } from '@src'

export function Vertical() {
  return (
    <ButtonGroup orientation="vertical" variant="outline" aria-label="Zoom">
      <Button size="icon-md" leading="i-lucide:plus" pressEffect="none" aria-label="Zoom in" />
      <Button size="icon-md" leading="i-lucide:minus" pressEffect="none" aria-label="Zoom out" />
    </ButtonGroup>
  )
}

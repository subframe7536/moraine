import { Button, ButtonGroup } from '@src'

export function Vertical() {
  return (
    <ButtonGroup orientation="vertical" variant="outline" aria-label="Zoom">
      <Button size="icon-md" leading="i-lucide:plus" activeEffect="none" aria-label="Zoom in" />
      <Button size="icon-md" leading="i-lucide:minus" activeEffect="none" aria-label="Zoom out" />
    </ButtonGroup>
  )
}

import { Button, ButtonGroup } from '@src'

export function Vertical() {
  return (
    <div class="flex flex-wrap gap-6 items-start">
      <ButtonGroup variant="outline" aria-label="Horizontal quantity controls">
        <Button size="icon-md" leading="i-lucide:minus" aria-label="Decrease quantity" />
        <Button size="icon-md" leading="i-lucide:plus" aria-label="Increase quantity" />
      </ButtonGroup>

      <ButtonGroup orientation="vertical" variant="outline" aria-label="Vertical quantity controls">
        <Button size="icon-md" leading="i-lucide:plus" aria-label="Increase quantity" />
        <Button size="icon-md" leading="i-lucide:minus" aria-label="Decrease quantity" />
      </ButtonGroup>
    </div>
  )
}

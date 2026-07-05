import { Kbd } from '@src'

export function ShortcutComposition() {
  return (
    <p class="text-sm text-foreground flex flex-wrap gap-2 items-center">
      Open command palette
      <Kbd value={['Ctrl', 'K']} between={<div>+</div>} />
    </p>
  )
}

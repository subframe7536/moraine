import { Kbd } from '@src'

export function ShortcutComposition() {
  return (
    <p class="text-sm text-foreground flex flex-wrap gap-2 items-center">
      Close dialogs with
      <Kbd value="Esc" label="Escape" />
    </p>
  )
}

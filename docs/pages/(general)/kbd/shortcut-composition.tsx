import { Kbd } from '@src'

export function ShortcutComposition() {
  return (
    <p class="text-foreground flex flex-wrap gap-2 items-center text-sm">
      Close dialogs with
      <Kbd value="escape" />
    </p>
  )
}

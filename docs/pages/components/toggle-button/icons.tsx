import { Icon, ToggleButton } from '@src'

export function Icons() {
  return (
    <div class="flex gap-3 items-center">
      <ToggleButton size="icon-md" leading="i-lucide:bold" aria-label="Bold" />
      <ToggleButton size="icon-md" leading="i-lucide:italic" aria-label="Italic" defaultPressed />
      <ToggleButton size="icon-md" aria-label="Bookmark" variant="outline" activeVariant="solid">
        {(state) => (
          <Icon
            name={state.pressed ? 'i-lucide:bookmark-check' : 'i-lucide:bookmark'}
            aria-hidden="true"
          />
        )}
      </ToggleButton>
    </div>
  )
}

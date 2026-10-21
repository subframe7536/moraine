import { Button, Icon, Tooltip } from '@src'
import { createSignal } from 'solid-js'

export function IconButtons() {
  const [bookmarked, setBookmarked] = createSignal(false)

  return (
    <div class="flex gap-3 items-center">
      <span class="text-sm">Release checklist</span>
      <Tooltip>
        <Tooltip.Trigger
          as={Button}
          variant="outline"
          size="icon-sm"
          aria-label={bookmarked() ? 'Remove bookmark' : 'Bookmark checklist'}
          onClick={() => setBookmarked((value) => !value)}
        >
          <Icon name={bookmarked() ? 'i-lucide:bookmark-check' : 'i-lucide:bookmark'} />
        </Tooltip.Trigger>
        <Tooltip.Content text={bookmarked() ? 'Remove bookmark' : 'Bookmark checklist'} />
      </Tooltip>
    </div>
  )
}

import { Button, Tooltip } from '@src'

export function KeyboardShortcuts() {
  return (
    <div class="p-2 b-(1 border) rounded-xl bg-card flex flex-wrap gap-2 items-center">
      <Tooltip text="Save changes" kbds={['⌘', 'S']} open>
        {(props) => (
          <Button {...props} variant="outline" size="sm" leading="i-lucide:save">
            Save
          </Button>
        )}
      </Tooltip>

      <Tooltip text="Bold formatting" kbds={['⌘', 'B']}>
        {(props) => (
          <Button {...props} variant="ghost" size="sm" leading="i-lucide:bold" aria-label="Bold" />
        )}
      </Tooltip>

      <Tooltip text="Italic formatting" kbds={['⌘', 'I']}>
        {(props) => (
          <Button
            {...props}
            variant="ghost"
            size="sm"
            leading="i-lucide:italic"
            aria-label="Italic"
          />
        )}
      </Tooltip>

      <Tooltip text="Insert Code Block" kbds={['⌘', 'E']}>
        {(props) => (
          <Button {...props} variant="ghost" size="sm" leading="i-lucide:code" aria-label="Code" />
        )}
      </Tooltip>

      <Tooltip text="Quick Search" kbds={['⌘', 'K']}>
        {(props) => (
          <Button
            {...props}
            variant="ghost"
            size="sm"
            leading="i-lucide:search"
            aria-label="Search"
          />
        )}
      </Tooltip>
    </div>
  )
}

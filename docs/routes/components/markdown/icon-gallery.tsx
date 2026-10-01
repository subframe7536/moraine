import { For } from 'solid-js'

import { Icon } from '../../../../src/index'
import { DEFAULT_ICON_SHORTCUTS } from '../../../../src/theme/icons'
import { createClipboardCopy } from '../../hooks/create-clipboard-copy'

export function IconGallery() {
  return (
    <div class="gap-2 grid grid-cols-3 lg:grid-cols-6 sm:grid-cols-4">
      <For each={DEFAULT_ICON_SHORTCUTS}>
        {([name]) => {
          const clipboard = createClipboardCopy({ resetAfter: 1800 })
          const message = () =>
            clipboard.state() === 'copied'
              ? 'Copied'
              : clipboard.state() === 'failed'
                ? 'Copy failed'
                : undefined

          return (
            <button
              type="button"
              class="group border border-border flex min-w-0 aspect-square transition-colors items-center justify-center relative rounded-lg focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background) hover:(border-primary/60 bg-primary/5)"
              aria-label={`Copy ${name}`}
              title={name}
              onClick={() => void clipboard.copy(name)}
            >
              <Icon name={name} size={28} class="size-7" />
              <Icon
                name={
                  message() === 'Copied'
                    ? 'icon-check'
                    : message() === 'Copy failed'
                      ? 'icon-error'
                      : 'icon-copy'
                }
                size={16}
                class={[
                  'size-4 right-2 top-2 absolute hidden group-hover:block',
                  message() === 'Copied'
                    ? 'text-primary'
                    : message() === 'Copy failed'
                      ? 'text-destructive'
                      : 'text-muted-foreground',
                ]}
              />
              <code class="text-muted-foreground leading-4 px-1 opacity-0 truncate transition-opacity inset-x-0 bottom-1 absolute text-xs group-focus:opacity-100 group-hover:opacity-100">
                {name}
              </code>
              <span role="status" class="sr-only">
                {message() ?? ''}
              </span>
            </button>
          )
        }}
      </For>
    </div>
  )
}

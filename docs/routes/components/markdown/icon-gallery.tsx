import { For, createSignal, onCleanup } from 'solid-js'

import { Icon } from '../../../../src/index.ts'
import { DEFAULT_ICON_SHORTCUTS } from '../../../../src/theme/style/icons.ts'

export function IconGallery() {
  const [feedback, setFeedback] = createSignal<{
    name: string
    message: 'Copied' | 'Copy failed'
  }>()
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => clearTimeout(feedbackTimer))

  async function copyIcon(name: string) {
    try {
      await navigator.clipboard.writeText(name)
      setFeedback({ name, message: 'Copied' })
    } catch {
      setFeedback({ name, message: 'Copy failed' })
    }

    clearTimeout(feedbackTimer)
    feedbackTimer = setTimeout(() => setFeedback(undefined), 1800)
  }

  return (
    <div class="gap-2 grid grid-cols-3 lg:grid-cols-6 sm:grid-cols-4">
      <For each={DEFAULT_ICON_SHORTCUTS}>
        {([name]) => {
          const message = () => (feedback()?.name === name ? feedback()?.message : undefined)

          return (
            <button
              type="button"
              data-copying={feedback() ? '' : undefined}
              class="group data-copy:pointer-events-none border border-border rounded-lg flex min-w-0 aspect-square transition-colors items-center justify-center relative focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background) hover:(border-primary/60 bg-primary/5)"
              aria-label={`Copy ${name}`}
              title={name}
              onClick={() => void copyIcon(name)}
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
              <code class="text-xs text-muted-foreground leading-4 px-1 opacity-0 truncate transition-opacity inset-x-0 bottom-1 absolute group-focus:opacity-100 group-hover:opacity-100">
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

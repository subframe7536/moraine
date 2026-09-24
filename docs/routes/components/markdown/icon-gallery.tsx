import { For, Show, createSignal, onCleanup } from 'solid-js'

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
    <div class="gap-3 grid grid-cols-2 lg:grid-cols-4 sm:grid-cols-3">
      <For each={DEFAULT_ICON_SHORTCUTS}>
        {([name]) => (
          <button
            type="button"
            class="p-4 border border-border rounded-lg flex flex-col gap-2 min-w-0 transition-colors items-center justify-center focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background) hover:(border-primary/60 bg-primary/5)"
            aria-label={`Copy ${name}`}
            onClick={() => void copyIcon(name)}
          >
            <Icon name={name} size={24} />
            <code class="text-xs text-muted-foreground text-center break-all">{name}</code>
            <Show when={feedback()?.name === name}>
              <span role="status" class="text-xs text-primary">
                {feedback()?.message}
              </span>
            </Show>
          </button>
        )}
      </For>
    </div>
  )
}

import { Textarea } from '@src'
import { createSignal } from 'solid-js'

export function Autoresize() {
  const [post, setPost] = createSignal(
    'Just deployed the new Moraine component library docs! Smooth animations, fully typed SolidJS components, and accessible primitives out of the box 🚀',
  )
  const maxLength = 280

  return (
    <div class="p-4 b-(1 border) max-w-xl space-y-3 rounded-xl">
      <label class="text-muted-foreground font-medium block text-xs">
        Draft Release Announcement
      </label>
      <Textarea
        autoResize
        rows={3}
        maxRows={8}
        value={post()}
        onValueChange={(next) => setPost(next ?? '')}
        placeholder="What's happening in your project?"
      />
      <div class="flex items-center justify-between text-xs">
        <span class="text-muted-foreground">Auto-expands as you type up to 8 rows.</span>
        <span
          class={`font-medium font-mono ${
            post().length > maxLength ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {post().length} / {maxLength}
        </span>
      </div>
    </div>
  )
}

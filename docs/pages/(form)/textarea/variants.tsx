import { Textarea } from '@src'

export function Variants() {
  return (
    <div class="gap-4 grid max-w-2xl w-full sm:grid-cols-2">
      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium">Outline (Support ticket)</label>
        <Textarea
          variant="outline"
          placeholder="Describe the steps to reproduce the issue..."
          rows={3}
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium">Subtle (PR review comment)</label>
        <Textarea
          variant="subtle"
          placeholder="Leave a review comment or code suggestion..."
          rows={3}
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium">
          Ghost (Scratchpad / Quick notes)
        </label>
        <Textarea variant="ghost" placeholder="Jot down quick thoughts..." rows={3} />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium">
          None (Embedded markdown editor)
        </label>
        <div class="p-2 b-(1 border) rounded-lg bg-card">
          <Textarea
            variant="none"
            placeholder="Write markdown content without standard borders..."
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}

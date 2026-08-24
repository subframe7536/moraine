import { Textarea } from '@src'

export function Sizes() {
  return (
    <div class="flex flex-col gap-4 max-w-xl">
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground font-medium">
          Small (sm) - Quick commit summary
        </label>
        <Textarea size="sm" placeholder="feat: add virtualized list component" rows={2} />
      </div>

      <div class="space-y-1">
        <label class="text-xs text-muted-foreground font-medium">
          Medium (md) - Support message
        </label>
        <Textarea size="md" placeholder="How can our engineering team help you today?" rows={3} />
      </div>

      <div class="space-y-1">
        <label class="text-xs text-muted-foreground font-medium">
          Large (lg) - Extensive release notes
        </label>
        <Textarea
          size="lg"
          placeholder="Write release highlights, migration guides, and breaking changes..."
          rows={4}
        />
      </div>
    </div>
  )
}

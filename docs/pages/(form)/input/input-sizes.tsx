import { Input } from '@src'

export function InputSizes() {
  return (
    <div class="flex flex-col gap-4 max-w-xl">
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground font-medium">
          Small (sm) - Compact table filter
        </label>
        <Input size="sm" leading="i-lucide:filter" placeholder="Filter by keyword..." />
      </div>

      <div class="space-y-1">
        <label class="text-xs text-muted-foreground font-medium">
          Medium (md) - Standard form field
        </label>
        <Input size="md" placeholder="Enter your full name" defaultValue="Alex Morgan" />
      </div>

      <div class="space-y-1">
        <label class="text-xs text-muted-foreground font-medium">
          Large (lg) - Hero search / prompt input
        </label>
        <Input
          size="lg"
          leading="i-lucide:sparkles"
          placeholder="Ask AI to generate a UI layout..."
        />
      </div>
    </div>
  )
}

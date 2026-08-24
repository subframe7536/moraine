import { Input, Kbd } from '@src'

export function InputVariants() {
  return (
    <div class="gap-4 grid max-w-2xl lg:grid-cols-2 sm:grid-cols-1">
      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium">
          Outline (Default form field)
        </label>
        <Input variant="outline" placeholder="alex.morgan@company.com" />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium">
          Subtle (Search bar with hotkey)
        </label>
        <Input
          variant="subtle"
          placeholder="Search repository..."
          leading="i-lucide:search"
          trailing={<Kbd size="sm" value="⌘K" />}
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium">
          Ghost (Inline title editing)
        </label>
        <Input variant="ghost" defaultValue="Q4 Product Roadmap & Goals" />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium">
          None (Custom container integration)
        </label>
        <div class="p-2 b-(1 border) rounded-lg bg-card">
          <Input variant="none" placeholder="Type a message without borders..." />
        </div>
      </div>
    </div>
  )
}

import { Select } from '@src'
import type { SelectT } from '@src'

const OPTIONS: SelectT.Item[] = [
  { label: 'United States', value: 'us' },
  { label: 'Germany', value: 'de' },
  { label: 'Japan', value: 'jp' },
]

export function SizesAndVariants() {
  return (
    <div class="max-w-xl w-full space-y-6">
      <div class="space-y-2">
        <span class="text-xs text-muted-foreground font-medium">Sizes</span>
        <div class="flex flex-col gap-3 items-start sm:flex-row sm:items-center">
          <Select items={OPTIONS} size="sm" defaultValue="us" class="w-40" />
          <Select items={OPTIONS} size="md" defaultValue="de" class="w-44" />
          <Select items={OPTIONS} size="lg" defaultValue="jp" class="w-48" />
        </div>
      </div>

      <div class="space-y-2">
        <span class="text-xs text-muted-foreground font-medium">Variants</span>
        <div class="flex flex-col gap-3 items-start sm:flex-row sm:items-center">
          <Select items={OPTIONS} variant="outline" defaultValue="us" class="w-44" />
          <Select items={OPTIONS} variant="subtle" defaultValue="de" class="w-44" />
          <Select items={OPTIONS} variant="ghost" defaultValue="jp" class="w-44" />
        </div>
      </div>
    </div>
  )
}

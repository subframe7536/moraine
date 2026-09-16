import { Combobox } from '@src'
import type { ComboboxT } from '@src'

const FRAMEWORKS: ComboboxT.Item[] = [
  { label: 'SolidJS', value: 'solid' },
  { label: 'React', value: 'react' },
  { label: 'Vue.js', value: 'vue' },
]

export function SizesAndVariants() {
  return (
    <div class="max-w-xl w-full space-y-6">
      <div class="space-y-2">
        <span class="text-xs text-muted-foreground font-medium">Sizes</span>
        <div class="flex flex-col gap-3 items-start sm:flex-row sm:items-center">
          <Combobox items={FRAMEWORKS} size="sm" defaultValue="solid" class="w-40" />
          <Combobox items={FRAMEWORKS} size="md" defaultValue="react" class="w-44" />
          <Combobox items={FRAMEWORKS} size="lg" defaultValue="vue" class="w-48" />
        </div>
      </div>

      <div class="space-y-2">
        <span class="text-xs text-muted-foreground font-medium">Variants</span>
        <div class="flex flex-col gap-3 items-start sm:flex-row sm:items-center">
          <Combobox items={FRAMEWORKS} variant="outline" defaultValue="solid" class="w-44" />
          <Combobox items={FRAMEWORKS} variant="subtle" defaultValue="react" class="w-44" />
          <Combobox items={FRAMEWORKS} variant="ghost" defaultValue="vue" class="w-44" />
        </div>
      </div>
    </div>
  )
}

import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'

const SKILLS: MultiSelectT.Item[] = [
  { label: 'SolidJS', value: 'solid' },
  { label: 'TypeScript', value: 'ts' },
  { label: 'UnoCSS', value: 'unocss' },
]

export function SizesAndVariants() {
  return (
    <div class="max-w-xl w-full space-y-6">
      <div class="space-y-2">
        <span class="text-xs text-muted-foreground font-medium">Sizes</span>
        <div class="space-y-3">
          <MultiSelect
            items={SKILLS}
            size="sm"
            defaultValue={['solid', 'ts']}
            placeholder="Small"
          />
          <MultiSelect
            items={SKILLS}
            size="md"
            defaultValue={['solid', 'ts']}
            placeholder="Medium"
          />
          <MultiSelect
            items={SKILLS}
            size="lg"
            defaultValue={['solid', 'ts']}
            placeholder="Large"
          />
        </div>
      </div>

      <div class="space-y-2">
        <span class="text-xs text-muted-foreground font-medium">Variants</span>
        <div class="space-y-3">
          <MultiSelect
            items={SKILLS}
            variant="outline"
            defaultValue={['solid']}
            placeholder="Outline"
          />
          <MultiSelect
            items={SKILLS}
            variant="subtle"
            defaultValue={['solid']}
            placeholder="Subtle"
          />
          <MultiSelect
            items={SKILLS}
            variant="ghost"
            defaultValue={['solid']}
            placeholder="Ghost"
          />
        </div>
      </div>
    </div>
  )
}

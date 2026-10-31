import { CommandPalette } from '@src'
import type { CommandPaletteT } from '@src'
import { createListVirtualizer } from '@src/virtualizer'

const GROUPS: CommandPaletteT.Group[] = ['Files', 'Symbols'].map((label) => ({
  id: label.toLowerCase(),
  label,
  items: Array.from({ length: 5_000 }, (_, index) => ({
    value: `${label.toLowerCase()}-${index}`,
    label: `${label.slice(0, -1)} ${index + 1}`,
  })),
}))

export function Virtualization() {
  const virtualizer = createListVirtualizer<CommandPaletteT.VirtualEntry>({
    estimateSize: (entry) => (entry.type === 'label' ? 24 : 32),
    getItemKey: (entry) => entry.key,
    overscan: 8,
  })

  return (
    <div class="max-w-md w-full">
      <CommandPalette
        autofocus={false}
        placeholder="Search 10,000 commands..."
        groups={GROUPS}
        virtualizer={virtualizer}
        classes={{ listbox: 'h-72' }}
      />
    </div>
  )
}

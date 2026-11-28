import { CommandPalette } from '@src'
import type { CommandPaletteT } from '@src'
import { createListVirtualizer } from '@src/virtualizer'
const GROUPS: Array<CommandPaletteT.Group> = ['Files', 'Symbols'].map((label) => ({
  type: 'group',
  label,
  children: Array.from({ length: 5000 }, (_, index) => ({
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
        autoFocus={false}
        placeholder="Search 10,000 commands..."
        items={GROUPS}
        virtualizer={virtualizer}
        classes={{ listbox: 'h-72' }}
      />
    </div>
  )
}

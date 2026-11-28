import { CommandPalette, Combobox, List, MultiSelect, Select, createTree } from 'moraine'
import type { CommandPaletteT, ComboboxT, ListT, MultiSelectT, SelectT, TreeT } from 'moraine'
import type { DataTableT, createDataTable } from 'moraine/data-table'
import { createListVirtualizer, createTableVirtualizer } from 'moraine/virtualizer'
// Every virtualizing component takes the whole virtualizer through one `virtualizer` prop. Only the entry type is passed; row and scroll element types never need to
// match a host by hand.

type Item = { id: number; label: string }
const items: Array<Item> = []

;<List
  items={items}
  virtualizer={createListVirtualizer<Item>({ estimateSize: () => 36 })}
  itemRender={(context) => <li {...context.rowProps}>{context.item.label}</li>}
/>

const tree = createTree<Item>({
  items: () => items,
  getKey: (item) => String(item.id),
  getItemLabel: (item) => item.label,
})
;<tree.Tree
  virtualizer={createListVirtualizer<TreeT.ItemInstance<Item>>({ estimateSize: () => 32 })}
/>

const options: Array<SelectT.Item<string>> = []
// Select has no virtualizer; use Combobox for collections large enough to need one.
;<Select<SelectT.Item<string>>
  items={options}
  // @ts-expect-error Select does not take a virtualizer.
  virtualizer={createListVirtualizer({ estimateSize: () => 32 })}
/>
;<Combobox<ComboboxT.Item<string>>
  items={options}
  virtualizer={createListVirtualizer<ComboboxT.Row<ComboboxT.Item<string>>>({
    estimateSize: () => 32,
  })}
/>
;<MultiSelect<MultiSelectT.Item<string>>
  items={options}
  virtualizer={createListVirtualizer<MultiSelectT.Row<MultiSelectT.Item<string>>>({
    estimateSize: () => 32,
  })}
/>
;<CommandPalette
  items={[]}
  virtualizer={createListVirtualizer<CommandPaletteT.VirtualEntry>({ estimateSize: () => 32 })}
/>

declare const table: ReturnType<typeof createDataTable<Item>>
;<table.DataTable
  virtualizer={createTableVirtualizer<DataTableT.Row<Item>>({
    estimateSize: () => 41,
    columns: { overscan: 2 },
  })}
/>

// A virtualizer for one entry type does not fit a host with another.
const stringVirtualizer = createListVirtualizer<string>({ estimateSize: () => 36 })
// @ts-expect-error entry types must match
export const mismatched: ListT.Virtualizer<Item> = stringVirtualizer

import { CommandPalette, Combobox, List, MultiSelect, Select, Table, createTree } from 'moraine'
import type { CommandPaletteT, ComboboxT, ListT, MultiSelectT, SelectT, TreeT } from 'moraine'
import { DataTable } from 'moraine/data-table'
import type { DataTableT, createDataTable } from 'moraine/data-table'
import { createListVirtualizer, createTableVirtualizer } from 'moraine/virtualizer'

// Every host takes the whole virtualizer through one `virtualizer` prop. Only the entry type is
// passed; row and scroll element types never need to match a host by hand.

type Item = { id: number; label: string }
const items: Item[] = []

;<List
  items={items}
  virtualizer={createListVirtualizer<Item>({ estimateSize: () => 36 })}
  itemRender={(context) => <li {...context.props}>{context.item.label}</li>}
/>

const tree = createTree<Item>({
  items: () => items,
  getKey: (item) => String(item.id),
  getTextValue: (item) => item.label,
})
;<tree.Tree
  virtualizer={createListVirtualizer<TreeT.ItemInstance<Item>>({ estimateSize: () => 32 })}
/>

const options: SelectT.Item<string>[] = []
;<Select<SelectT.Item<string>>
  items={options}
  virtualizer={createListVirtualizer<SelectT.Row<SelectT.Item<string>>>({ estimateSize: () => 32 })}
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
  groups={[]}
  virtualizer={createListVirtualizer<CommandPaletteT.VirtualEntry>({ estimateSize: () => 32 })}
/>

;<Table>
  <Table.Body>
    <Table.VirtualRows
      items={items}
      virtualizer={createTableVirtualizer<Item, string>({
        estimateSize: () => 41,
        columns: { overscan: 2 },
      })}
      columns={['label']}
      itemRender={(row) => (
        <Table.Row {...row.props}>
          <Table.VirtualCells<string>
            itemRender={(cell) => <Table.Cell {...cell.props}>{cell.column}</Table.Cell>}
          />
        </Table.Row>
      )}
    />
  </Table.Body>
</Table>

declare const table: ReturnType<typeof createDataTable<Item>>
;<DataTable
  table={table}
  virtualizer={createTableVirtualizer<DataTableT.Row<Item>>({
    estimateSize: () => 41,
    columns: { overscan: 2 },
  })}
/>

// A virtualizer for one entry type does not fit a host with another.
const stringVirtualizer = createListVirtualizer<string>({ estimateSize: () => 36 })
// @ts-expect-error entry types must match
export const mismatched: ListT.Virtualizer<Item> = stringVirtualizer

import { Table } from '@src'
import { createTableVirtualizer } from '@src/virtualizer'
import { For, createSignal } from 'solid-js'

const SERVER_WIDTH = 140
const HOUR_WIDTH = 72

const HOURS = Array.from({ length: 168 }, (_, index) => ({
  key: `h${index}`,
  label: `H${index + 1}`,
}))

const ROWS = Array.from({ length: 2_000 }, (_, index) => ({
  id: index + 1,
  server: `node-${String(index + 1).padStart(4, '0')}`,
}))

type Hour = (typeof HOURS)[number]
type Row = (typeof ROWS)[number]

const usage = (row: Row, hour: number) => `${(row.id * 7 + hour * 13) % 100}%`

export function VirtualColumns() {
  const [scrollElement, setScrollElement] = createSignal<HTMLDivElement>()
  const virtualizer = createTableVirtualizer<Row, Hour>({
    estimateSize: () => 41,
    getItemKey: (row) => row.id,
    overscan: 8,
    columns: { overscan: 2, getItemKey: (hour) => hour.key },
  })

  return (
    <Table
      containerRef={setScrollElement}
      classes={{
        container: 'max-h-96 overflow-auto rounded-lg border border-border',
        root: 'table-fixed',
        header: 'sticky top-0 z-10 bg-background',
      }}
      style={{ width: `${SERVER_WIDTH + HOURS.length * HOUR_WIDTH}px` }}
      aria-colcount={HOURS.length + 1}
    >
      <colgroup>
        <col style={{ width: `${SERVER_WIDTH}px` }} />
        <For each={HOURS}>{() => <col style={{ width: `${HOUR_WIDTH}px` }} />}</For>
      </colgroup>
      <Table.Header>
        <Table.Row>
          <Table.Head>Server</Table.Head>
          <For each={HOURS}>{(hour) => <Table.Head align="right">{hour.label}</Table.Head>}</For>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.VirtualRows
          items={ROWS}
          virtualizer={virtualizer}
          scrollElement={scrollElement()}
          columns={HOURS}
          columnSize={() => HOUR_WIDTH}
          // The server column sits before the virtualized hours.
          columnLayout={{ scrollMargin: SERVER_WIDTH }}
          columnIndexStart={2}
          itemRender={(row) => (
            <Table.Row {...row.props}>
              <Table.Cell class="font-medium">{row.item.server}</Table.Cell>
              <Table.VirtualCells<Hour>
                itemRender={(cell) => (
                  <Table.Cell {...cell.props} align="right">
                    {usage(row.item, cell.index)}
                  </Table.Cell>
                )}
              />
            </Table.Row>
          )}
        />
      </Table.Body>
    </Table>
  )
}

import { Button, DataTable } from '@src'
import type { ColumnDef } from '@tanstack/solid-table'
import { For, createSignal } from 'solid-js'

interface Employee {
  id: string
  name: string
  role: string
  department: string
  location: string
}

const DATA: Employee[] = [
  { id: '1', name: 'Alice Johnson', role: 'Engineer', department: 'Platform', location: 'Austin' },
  { id: '2', name: 'Bob Smith', role: 'Designer', department: 'Product', location: 'Berlin' },
  { id: '3', name: 'Laura Croft', role: 'Engineer', department: 'Security', location: 'London' },
  { id: '4', name: 'Evan Wright', role: 'Developer', department: 'Mobile', location: 'Tokyo' },
]

const COLUMN_IDS = ['name', 'role', 'department', 'location'] as const

const COLUMNS: ColumnDef<any, Employee>[] = [
  { accessorKey: 'name', header: 'Name', size: 180 },
  { accessorKey: 'role', header: 'Role', size: 140 },
  { accessorKey: 'department', header: 'Department', size: 160 },
  { accessorKey: 'location', header: 'Location', size: 140 },
]

const LABELS: Record<(typeof COLUMN_IDS)[number], string> = {
  name: 'Name',
  role: 'Role',
  department: 'Department',
  location: 'Location',
}

export default function ColumnOrderExample() {
  const [columnOrder, setColumnOrder] = createSignal<string[]>([...COLUMN_IDS])

  const move = (id: string, direction: -1 | 1) => {
    setColumnOrder((current) => {
      const index = current.indexOf(id)
      const nextIndex = index + direction
      if (index === -1 || nextIndex < 0 || nextIndex >= current.length) {
        return current
      }
      const next = [...current]
      const swap = next[nextIndex]!
      next[nextIndex] = next[index]!
      next[index] = swap
      return next
    })
  }

  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="flex flex-wrap gap-2 items-center">
        <For each={columnOrder()}>
          {(id, index) => (
            <div class="px-1.5 py-1 border border-border rounded-md bg-muted/40 flex gap-1 items-center">
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`Move ${LABELS[id as (typeof COLUMN_IDS)[number]]} left`}
                disabled={index() === 0}
                leading="i-lucide:chevron-left"
                onClick={() => move(id, -1)}
              />
              <span class="text-xs font-medium">{LABELS[id as (typeof COLUMN_IDS)[number]]}</span>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`Move ${LABELS[id as (typeof COLUMN_IDS)[number]]} right`}
                disabled={index() === columnOrder().length - 1}
                leading="i-lucide:chevron-right"
                onClick={() => move(id, 1)}
              />
            </div>
          )}
        </For>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setColumnOrder([...COLUMN_IDS])}
          disabled={columnOrder().every((id, i) => id === COLUMN_IDS[i])}
        >
          Reset
        </Button>
      </div>
      <DataTable
        data={DATA}
        columns={COLUMNS}
        currentColumnOrder={columnOrder()}
        onColumnOrderChange={setColumnOrder}
        hoverEffect
        classes={{ container: 'border border-border rounded-lg' }}
      />
    </div>
  )
}

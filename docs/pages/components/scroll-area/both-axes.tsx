import { ScrollArea } from '@src'
import { For } from 'solid-js'

const columns = Array.from({ length: 12 }, (_, index) => `Week ${index + 1}`)
const rows = ['Design', 'Engineering', 'Marketing', 'Support', 'Sales', 'Finance', 'Legal']

export function BothAxes() {
  return (
    <ScrollArea
      orientation="both"
      class="border border-border rounded-md h-56 max-w-lg w-full"
      role="region"
      aria-label="Team capacity"
    >
      <table class="text-sm">
        <thead>
          <tr>
            <th class="font-medium px-3 py-2 text-start">Team</th>
            <For each={columns}>
              {(column) => (
                <th class="font-medium px-3 py-2 text-start whitespace-nowrap">{column}</th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={rows}>
            {(row, rowIndex) => (
              <tr class="border-t border-border">
                <td class="font-medium px-3 py-2">{row}</td>
                <For each={columns}>
                  {(_column, columnIndex) => (
                    <td class="text-muted-foreground px-3 py-2 tabular-nums">
                      {((rowIndex() * 7 + columnIndex() * 13) % 60) + 40}%
                    </td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </ScrollArea>
  )
}

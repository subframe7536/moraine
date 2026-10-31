import { Button, Icon, Resizable } from '@src'
import { For, createSignal } from 'solid-js'

const DATA_ROWS = [
  { id: 'usr_01', name: 'Alice Chen', role: 'Maintainer', latency: '12ms' },
  { id: 'usr_02', name: 'Devin Cole', role: 'Contributor', latency: '18ms' },
  { id: 'usr_03', name: 'Kiran Patel', role: 'Viewer', latency: '9ms' },
]

export function VerticalDisable() {
  const [disabled, setDisabled] = createSignal(false)

  return (
    <div class="space-y-3">
      <div class="text-xs flex items-center justify-between">
        <div class="flex gap-2 items-center">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setDisabled((prev) => !prev)}
            leading={disabled() ? 'i-lucide:lock' : 'i-lucide:unlock'}
          >
            {disabled() ? 'Unlock divider' : 'Lock divider'}
          </Button>
          <span class="text-muted-foreground">
            {disabled() ? 'Divider locked against dragging' : 'Drag the divider to resize'}
          </span>
        </div>
        <span class="text-xs text-muted-foreground font-mono">orientation="vertical"</span>
      </div>

      <div class="border border-border rounded-xl h-80 w-full overflow-hidden">
        <Resizable orientation="vertical" disabled={disabled()} defaultValue={['52%', '48%']}>
          {/* Top Panel: SQL Query Editor */}
          <Resizable.Panel min="25%">
            <div class="p-3 flex flex-col h-full justify-between">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold flex gap-1.5 items-center">
                    <Icon name="i-lucide:database" />
                    SQL Query Editor
                  </span>
                  <span class="text-xs text-muted-foreground font-mono">analytics_db.prod</span>
                </div>
                <div class="text-xs font-mono p-2.5 border border-border rounded-lg space-y-1">
                  <div>SELECT id, name, role, latency</div>
                  <div>FROM team_members</div>
                  <div>WHERE status = 'active'</div>
                  <div>ORDER BY latency;</div>
                </div>
              </div>

              <div class="pt-2 flex items-center justify-between">
                <span class="text-xs text-muted-foreground">Estimated scan: 3 rows</span>
                <Button size="xs" leading="i-lucide:play">
                  Execute
                </Button>
              </div>
            </div>
          </Resizable.Panel>

          <Resizable.Handle>
            <Icon name="i-lucide:grip-horizontal" />
          </Resizable.Handle>

          {/* Bottom Panel: Data Table Results */}
          <Resizable.Panel min="25%">
            <div class="p-3 flex flex-col h-full justify-between">
              <div class="overflow-auto space-y-2">
                <div class="text-xs flex items-center justify-between">
                  <span class="font-medium">Results</span>
                  <span class="text-xs text-muted-foreground font-mono">3 rows returned</span>
                </div>
                <table class="text-xs text-left w-full">
                  <thead>
                    <tr class="text-xs text-muted-foreground font-mono border-b border-border">
                      <th class="py-1">ID</th>
                      <th class="py-1">NAME</th>
                      <th class="py-1">ROLE</th>
                      <th class="py-1 text-right">LATENCY</th>
                    </tr>
                  </thead>
                  <tbody class="divide-border divide-y">
                    <For each={DATA_ROWS}>
                      {(row) => (
                        <tr>
                          <td class="text-muted-foreground font-mono py-1">{row.id}</td>
                          <td class="font-medium py-1">{row.name}</td>
                          <td class="text-muted-foreground py-1">{row.role}</td>
                          <td class="font-mono py-1 text-right">{row.latency}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>

              <div class="text-xs text-muted-foreground pt-1 border-t border-border">
                The two panels stack vertically and scroll independently.
              </div>
            </div>
          </Resizable.Panel>
        </Resizable>
      </div>
    </div>
  )
}

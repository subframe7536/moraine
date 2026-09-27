import { Button, Icon, Resizable } from '@src'
import { For, createSignal } from 'solid-js'

const DATA_ROWS = [
  { id: 'usr_01', name: 'Alice Chen', role: 'Maintainer', queries: '1,420', latency: '12ms' },
  { id: 'usr_02', name: 'Devin Cole', role: 'Contributor', queries: '834', latency: '18ms' },
  { id: 'usr_03', name: 'Kiran Patel', role: 'Viewer', queries: '129', latency: '9ms' },
]

export function VerticalDisable() {
  const [disabled, setDisabled] = createSignal(false)

  return (
    <div class="space-y-3">
      <div class="flex items-center justify-between text-xs">
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
            {disabled() ? 'Dividers locked against dragging' : 'Drag divider vertically to resize'}
          </span>
        </div>
        <span class="text-[11px] text-muted-foreground font-mono">orientation="vertical"</span>
      </div>

      <div class="border border-border/60 bg-card/30 h-80 w-full shadow-xs overflow-hidden rounded-xl">
        <Resizable
          orientation="vertical"
          disabled={disabled()}
          defaultValue={['52%', '48%']}
          classes={{ handle: 'bg-border/80' }}
        >
          {/* Top Panel: SQL Query Editor */}
          <Resizable.Panel min="25%" class="p-3 bg-muted/20 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-foreground font-semibold flex gap-1.5 items-center text-xs">
                  <Icon name="i-lucide:database" class="text-primary size-3.5" />
                  SQL Query Editor
                </span>
                <span class="text-[10px] text-muted-foreground font-mono">analytics_db.prod</span>
              </div>
              <div class="text-foreground font-mono p-2.5 border border-border/50 bg-background/70 space-y-1 text-xs rounded-lg">
                <div>
                  <span class="text-purple-500">SELECT</span> id, name, role, queries, latency
                </div>
                <div>
                  <span class="text-purple-500">FROM</span> team_members
                </div>
                <div>
                  <span class="text-purple-500">WHERE</span> status ={' '}
                  <span class="text-emerald-600 dark:text-emerald-400">'active'</span>
                </div>
                <div>
                  <span class="text-purple-500">ORDER BY</span> queries{' '}
                  <span class="text-purple-500">DESC</span>;
                </div>
              </div>
            </div>

            <div class="pt-2 flex items-center justify-between">
              <span class="text-[11px] text-muted-foreground">Estimated scan: 3 rows (0.4ms)</span>
              <Button size="xs" variant="default" leading="i-lucide:play">
                Execute
              </Button>
            </div>
          </Resizable.Panel>

          <Resizable.Handle>
            <Icon name="i-lucide:grip-horizontal" class="text-muted-foreground/70 size-3" />
          </Resizable.Handle>

          {/* Bottom Panel: Data Table Results */}
          <Resizable.Panel min="25%" class="p-3 bg-background/50 flex flex-col justify-between">
            <div class="overflow-auto space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-foreground font-medium">Results</span>
                <span class="text-[10px] text-muted-foreground font-mono">3 rows returned</span>
              </div>
              <table class="text-left w-full text-xs">
                <thead>
                  <tr class="text-[11px] text-muted-foreground font-mono border-b border-border/50">
                    <th class="py-1">ID</th>
                    <th class="py-1">NAME</th>
                    <th class="py-1">ROLE</th>
                    <th class="py-1 text-right">LATENCY</th>
                  </tr>
                </thead>
                <tbody class="divide-border/30 divide-y">
                  <For each={DATA_ROWS}>
                    {(row) => (
                      <tr class="hover:bg-muted/30">
                        <td class="text-muted-foreground font-mono py-1">{row.id}</td>
                        <td class="text-foreground font-medium py-1">{row.name}</td>
                        <td class="text-muted-foreground py-1">{row.role}</td>
                        <td class="text-emerald-600 font-mono py-1 text-right dark:text-emerald-400">
                          {row.latency}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>

            <div class="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              Vertical stack demonstrates flex-column layout with independent scrolling.
            </div>
          </Resizable.Panel>
        </Resizable>
      </div>
    </div>
  )
}

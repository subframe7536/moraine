import { Icon, Resizable } from '@src'
import { For } from 'solid-js'

const FILES = [
  { name: 'src/app.tsx', active: true, icon: 'i-lucide:file-code', color: 'text-blue-500' },
  { name: 'src/theme.ts', icon: 'i-lucide:file-code', color: 'text-blue-500' },
  { name: 'package.json', icon: 'i-lucide:file-json', color: 'text-amber-500' },
  { name: 'README.md', icon: 'i-lucide:file-text', color: 'text-muted-foreground' },
]

export function NestedPanels() {
  return (
    <div class="border border-border rounded-xl bg-card/30 h-80 w-full shadow-xs overflow-hidden">
      <Resizable defaultValue={['28%', '72%']}>
        {/* Sidebar explorer */}
        <Resizable.Panel min="20%" max="40%" class="bg-muted/25 flex flex-col justify-between">
          <div>
            <div class="text-[11px] text-muted-foreground tracking-wider font-semibold px-3 border-b border-border/50 flex h-8 uppercase items-center justify-between">
              <span>Explorer</span>
              <Icon name="i-lucide:more-horizontal" class="size-3.5" />
            </div>
            <div class="p-1 space-y-0.5">
              <For each={FILES}>
                {(file) => (
                  <div
                    class={`text-xs px-2 py-1 rounded-md flex gap-2 cursor-pointer transition-colors items-center ${
                      file.active
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <Icon name={file.icon} class={`shrink-0 size-3.5 ${file.color}`} />
                    <span class="truncate">{file.name}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
          <div class="text-[10px] text-muted-foreground px-3 py-1.5 border-t border-border/40 flex items-center justify-between">
            <span>branch: main</span>
            <span class="text-emerald-500">● clean</span>
          </div>
        </Resizable.Panel>

        {/* Intersection handle between sidebar and nested editor/terminal */}
        <Resizable.Handle intersection />

        {/* Nested vertical workspace */}
        <Resizable.Panel min="40%">
          <Resizable orientation="vertical" defaultValue={['62%', '38%']}>
            {/* Editor buffer */}
            <Resizable.Panel min="30%" class="bg-background flex flex-col">
              <div class="text-xs px-3 border-b border-border/50 bg-muted/30 flex gap-2 h-8 items-center">
                <Icon name="i-lucide:file-code" class="text-blue-500 size-3.5" />
                <span class="text-foreground font-medium">app.tsx</span>
                <span class="rounded-full bg-blue-500 size-1.5" />
              </div>
              <div class="text-xs text-muted-foreground font-mono p-3 bg-background/50 flex-1 overflow-auto space-y-1">
                <div class="text-muted-foreground/60">// Resizable Workspace Composition</div>
                <div>
                  <span class="text-purple-500">export function</span>{' '}
                  <span class="text-blue-500">Workspace</span>() {'{'}
                </div>
                <div class="pl-4">
                  <span class="text-purple-500">return</span> (
                </div>
                <div class="text-emerald-600 pl-8 dark:text-emerald-400">
                  {'<Resizable orientation="horizontal">'}
                </div>
                <div class="text-muted-foreground pl-12">{'<Resizable.Panel min="20%" />'}</div>
                <div class="text-muted-foreground pl-12">{'<Resizable.Handle intersection />'}</div>
                <div class="text-emerald-600 pl-8 dark:text-emerald-400">{'</Resizable>'}</div>
                <div class="pl-4">)</div>
                <div>{'}'}</div>
              </div>
            </Resizable.Panel>

            {/* Intersection handle with grip icon */}
            <Resizable.Handle intersection>
              <Icon name="i-lucide:grip-horizontal" class="text-muted-foreground/80 size-3" />
            </Resizable.Handle>

            {/* Terminal console */}
            <Resizable.Panel min="20%" class="bg-muted/20 flex flex-col justify-between">
              <div class="text-[11px] text-muted-foreground px-3 border-b border-border/40 flex gap-3 h-7 items-center">
                <span class="text-foreground font-medium pt-0.5 border-primary border-b-2">
                  Terminal
                </span>
                <span>Output</span>
                <span>Problems (0)</span>
              </div>
              <div class="text-xs text-foreground font-mono p-2.5 space-y-0.5">
                <div class="text-muted-foreground">$ vite --host</div>
                <div class="text-emerald-600 dark:text-emerald-400">
                  ➜ Local: http://localhost:5173/
                </div>
              </div>
              <div class="text-[10px] text-muted-foreground px-2.5 py-1 border-t border-border/30 bg-muted/40 flex items-center justify-between">
                <span>Drag the junction corner to resize both axes simultaneously.</span>
                <span>node v22.14.0</span>
              </div>
            </Resizable.Panel>
          </Resizable>
        </Resizable.Panel>
      </Resizable>
    </div>
  )
}

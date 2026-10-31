import { Icon, Resizable } from '@src'
import { For } from 'solid-js'

const FILES = [
  { name: 'src/app.tsx', active: true, icon: 'i-lucide:file-code' },
  { name: 'src/theme.ts', icon: 'i-lucide:file-code' },
  { name: 'package.json', icon: 'i-lucide:file-json' },
  { name: 'README.md', icon: 'i-lucide:file-text' },
]

export function NestedPanels() {
  return (
    <div class="border border-border rounded-xl h-80 w-full overflow-hidden">
      <Resizable defaultValue={['28%', '72%']}>
        {/* Sidebar explorer */}
        <Resizable.Panel min="20%" max="40%">
          <div class="flex flex-col h-full justify-between">
            <div>
              <div class="text-xs text-muted-foreground tracking-wider font-semibold px-3 border-b border-border flex h-8 uppercase items-center justify-between">
                <span>Explorer</span>
                <Icon name="i-lucide:more-horizontal" />
              </div>
              <div class="p-1 space-y-0.5">
                <For each={FILES}>
                  {(file) => (
                    <div
                      class={`text-xs px-2 py-1 rounded-md flex gap-2 cursor-pointer items-center ${
                        file.active
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon name={file.icon} />
                      <span class="truncate">{file.name}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
            <div class="text-xs text-muted-foreground px-3 py-1.5 border-t border-border flex items-center justify-between">
              <span>branch: main</span>
              <span>clean</span>
            </div>
          </div>
        </Resizable.Panel>

        {/* Intersection handle between sidebar and nested editor/terminal */}
        <Resizable.Handle intersection />

        {/* Nested vertical workspace */}
        <Resizable.Panel min="40%">
          <Resizable orientation="vertical" defaultValue={['62%', '38%']}>
            {/* Editor buffer */}
            <Resizable.Panel min="30%">
              <div class="flex flex-col h-full">
                <div class="text-xs px-3 border-b border-border flex gap-2 h-8 items-center">
                  <Icon name="i-lucide:file-code" />
                  <span class="font-medium">app.tsx</span>
                </div>
                <div class="text-xs text-muted-foreground font-mono p-3 flex-1 overflow-auto space-y-1">
                  <div>// Resizable workspace composition</div>
                  <div>export function Workspace() {'{'}</div>
                  <div class="pl-4">return (</div>
                  <div class="pl-8">{'<Resizable orientation="horizontal">'}</div>
                  <div class="pl-12">{'<Resizable.Panel min="20%" />'}</div>
                  <div class="pl-12">{'<Resizable.Handle intersection />'}</div>
                  <div class="pl-8">{'</Resizable>'}</div>
                  <div class="pl-4">)</div>
                  <div>{'}'}</div>
                </div>
              </div>
            </Resizable.Panel>

            {/* Intersection handle with grip icon */}
            <Resizable.Handle intersection>
              <Icon name="i-lucide:grip-horizontal" />
            </Resizable.Handle>

            {/* Terminal console */}
            <Resizable.Panel min="20%">
              <div class="flex flex-col h-full justify-between">
                <div class="text-xs text-muted-foreground px-3 border-b border-border flex gap-3 h-7 items-center">
                  <span class="text-foreground font-medium border-primary border-b-2">
                    Terminal
                  </span>
                  <span>Output</span>
                  <span>Problems (0)</span>
                </div>
                <div class="text-xs font-mono p-2.5 space-y-0.5">
                  <div class="text-muted-foreground">$ vite --host</div>
                  <div>Local: http://localhost:5173/</div>
                </div>
                <div class="text-xs text-muted-foreground px-2.5 py-1 border-t border-border flex items-center justify-between">
                  <span>Drag the junction corner to resize both axes at once.</span>
                  <span>node v22.14.0</span>
                </div>
              </div>
            </Resizable.Panel>
          </Resizable>
        </Resizable.Panel>
      </Resizable>
    </div>
  )
}

import { Icon, Sidebar } from '@src'
import { For, createSignal } from 'solid-js'

function FileExplorerContent() {
  const files = [
    { name: 'src', type: 'folder-open', level: 0 },
    { name: 'components', type: 'folder', level: 1 },
    { name: 'navigation', type: 'folder-open', level: 1 },
    { name: 'sidebar.tsx', type: 'file-code', level: 2, active: true },
    { name: 'sidebar.recipe.ts', type: 'file-code', level: 2 },
    { name: 'index.ts', type: 'file-code', level: 1 },
    { name: 'package.json', type: 'file-json', level: 0 },
    { name: 'README.md', type: 'file-text', level: 0 },
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return 'i-lucide:folder'
      case 'folder-open':
        return 'i-lucide:folder-open'
      case 'file-json':
        return 'i-lucide:file-json'
      case 'file-text':
        return 'i-lucide:file-text'
      default:
        return 'i-lucide:file-code'
    }
  }

  return (
    <>
      <Sidebar.Header class="px-4 border-b border-border/60 h-9 items-center">
        <span class="text-[11px] text-muted-foreground tracking-wider font-bold uppercase">
          Explorer: Moraine
        </span>
      </Sidebar.Header>

      <Sidebar.Content class="p-2 space-y-0.5">
        <For each={files}>
          {(file) => (
            <div
              class={`text-xs px-2 py-1 rounded flex gap-2 cursor-pointer transition-colors items-center ${
                file.active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
              style={{ 'padding-left': `${(file.level + 1) * 8}px` }}
            >
              <Icon
                name={getIcon(file.type)}
                class={`shrink-0 size-3.5 ${file.type.startsWith('folder') ? 'text-amber-500' : 'text-blue-500'}`}
              />
              <span class="truncate">{file.name}</span>
            </div>
          )}
        </For>
      </Sidebar.Content>
    </>
  )
}

export function ResizableRail() {
  const [width, setWidth] = createSignal(240)

  return (
    <div class="border border-border rounded-xl bg-background h-96 w-full shadow-xs overflow-hidden">
      <Sidebar
        width={width()}
        onWidthChange={setWidth}
        minWidth={200}
        maxWidth={320}
        class="h-full"
      >
        <Sidebar.Panel class="bg-card/40">
          <FileExplorerContent />
        </Sidebar.Panel>
        <Sidebar.Rail />
        <Sidebar.Inset class="bg-card/30 flex flex-col">
          <div class="text-xs px-3 border-b border-border/60 bg-muted/40 flex shrink-0 h-9 items-center justify-between">
            <div class="font-medium flex gap-2 items-center">
              <Icon name="i-lucide:file-code" class="text-blue-500 size-3.5" />
              <span>sidebar.tsx</span>
            </div>
            <Sidebar.Trigger aria-label="Toggle sidebar" />
          </div>
          <div class="text-xs font-mono p-4 flex-1">
            <div class="text-muted-foreground/60">// Drag the rail or use the arrow keys</div>
            <div>
              <span class="text-purple-500">width</span> ={' '}
              <span class="text-blue-500 font-semibold">{width()}</span>
              <span class="text-muted-foreground">px</span>
            </div>
          </div>
        </Sidebar.Inset>
      </Sidebar>
    </div>
  )
}

import { Button, Icon, Resizable, SidebarFrame, useSidebarFrame } from '@src'
import { For, Show } from 'solid-js'

function FileExplorerContent() {
  const files = [
    { name: 'src', type: 'folder-open', level: 0 },
    { name: 'components', type: 'folder', level: 1 },
    { name: 'navigation', type: 'folder-open', level: 1 },
    { name: 'sidebar-frame.tsx', type: 'file-code', level: 2, active: true },
    { name: 'sidebar-frame.recipe.ts', type: 'file-code', level: 2 },
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
      <SidebarFrame.SidebarHeader class="px-3 border-b border-border/60 flex h-9 items-center justify-between">
        <span class="text-[11px] text-muted-foreground tracking-wider font-bold uppercase">
          Explorer: Moraine
        </span>
        <div class="flex gap-0.5 items-center">
          <Button variant="ghost" size="icon-xs" aria-label="New file">
            <Icon name="i-lucide:file-plus" class="text-muted-foreground size-3" />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="Refresh explorer">
            <Icon name="i-lucide:refresh-cw" class="text-muted-foreground size-3" />
          </Button>
        </div>
      </SidebarFrame.SidebarHeader>

      <SidebarFrame.SidebarBody class="p-1 space-y-0.5">
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
      </SidebarFrame.SidebarBody>
    </>
  )
}

function EditorContent() {
  return (
    <SidebarFrame.Main class="bg-card/30 flex flex-col h-full">
      {/* Tab bar */}
      <div class="text-xs border-b border-border/60 bg-muted/40 flex shrink-0 h-9 items-center">
        <div class="font-medium px-3 border-r border-border/60 border-t-2 border-t-primary bg-background flex gap-2 h-full items-center">
          <Icon name="i-lucide:file-code" class="text-blue-500 size-3.5" />
          <span>sidebar-frame.tsx</span>
          <Icon name="i-lucide:x" class="opacity-60 size-3 cursor-pointer hover:opacity-100" />
        </div>
        <div class="text-muted-foreground px-3 py-1.5 border-r border-border/60 flex gap-2 items-center">
          <Icon name="i-lucide:file-code" class="opacity-60 size-3.5" />
          <span>index.ts</span>
        </div>
      </div>

      {/* Editor code area */}
      <div class="text-xs font-mono p-4 bg-background/50 flex-1 overflow-auto space-y-1">
        <div class="text-muted-foreground/60">// Moraine Responsive SidebarFrame Primitive</div>
        <div>
          <span class="text-purple-500">export function</span>{' '}
          <span class="text-blue-500 font-semibold">SidebarFrame</span>
          <span class="text-muted-foreground">(props: SidebarFrameProps)</span> {'{'}
        </div>
        <div class="pl-4">
          <span class="text-purple-500">const</span> [local, rest] ={' '}
          <span class="text-blue-500">splitProps</span>
          (props, ['variant', 'side', 'isMobile'])
        </div>
        <div class="pl-4">
          <span class="text-purple-500">const</span> resolved ={' '}
          <span class="text-blue-500">createStyles</span>
          (sidebarFrameRecipe, local)
        </div>
        <div class="pl-4">
          <span class="text-purple-500">return</span> (
        </div>
        <div class="text-emerald-600 pl-8 dark:text-emerald-400">
          {'<SidebarFrameProvider value={context}>'}
        </div>
        <div class="pl-12">{'<div data-slot="root" {...rest}>'}</div>
        <div class="pl-16">{'{local.children}'}</div>
        <div class="pl-12">{'</div>'}</div>
        <div class="text-emerald-600 pl-8 dark:text-emerald-400">{'</SidebarFrameProvider>'}</div>
        <div class="pl-4">)</div>
        <div>{'}'}</div>
      </div>

      {/* Status Bar */}
      <div class="text-[11px] text-muted-foreground px-3 py-1 border-t border-border/60 bg-muted/40 flex shrink-0 items-center justify-between">
        <div class="flex gap-3 items-center">
          <span class="text-foreground font-medium flex gap-1 items-center">
            <Icon name="i-lucide:git-branch" class="size-3" />
            main*
          </span>
          <span>0 errors, 0 warnings</span>
        </div>
        <div class="flex gap-3 items-center">
          <span>TypeScript 5.8</span>
          <span>UTF-8</span>
          <span>Ln 12, Col 24</span>
        </div>
      </div>
    </SidebarFrame.Main>
  )
}

function ResizableLayout() {
  const frame = useSidebarFrame()

  return (
    <Show
      when={frame.isMobile()}
      fallback={
        <Resizable class="flex-1 h-full" data-frame-resizable>
          <Resizable.Panel defaultSize="32%" min={180} max={360} collapsible collapsibleMin={56}>
            <SidebarFrame.Sidebar class="bg-card/30 max-w-none! w-full!">
              <FileExplorerContent />
            </SidebarFrame.Sidebar>
          </Resizable.Panel>
          <Resizable.Handle action="collapse">
            {(state) => (
              <Icon
                name={state.collapsed ? 'i-lucide:panel-left-open' : 'i-lucide:panel-left-close'}
              />
            )}
          </Resizable.Handle>
          <Resizable.Panel>
            <EditorContent />
          </Resizable.Panel>
        </Resizable>
      }
    >
      <SidebarFrame.Sidebar class="bg-card/40">
        <FileExplorerContent />
      </SidebarFrame.Sidebar>
      <EditorContent />
    </Show>
  )
}

export function SheetResizableRender() {
  return (
    <div class="border border-border/70 rounded-xl bg-background h-96 w-full shadow-xs overflow-hidden">
      <SidebarFrame>
        <ResizableLayout />
      </SidebarFrame>
    </div>
  )
}

import { Icon, Resizable } from '@src'

const panelClass = 'text-xs text-muted-foreground p-4 flex h-full items-center justify-center'

export function NestedPanels() {
  return (
    <div class="b-1 b-border border-border h-72 max-w-lg w-full overflow-hidden rounded-xl">
      <Resizable>
        <Resizable.Panel defaultSize="32%" min="20%" class={`${panelClass} bg-muted`}>
          Sidebar
        </Resizable.Panel>
        <Resizable.Handle intersection />
        <Resizable.Panel defaultSize="68%" min="35%">
          <Resizable orientation="vertical">
            <Resizable.Panel defaultSize="50%" min="25%" class={panelClass}>
              Editor
            </Resizable.Panel>
            <Resizable.Handle intersection>
              <Icon name="i-lucide:activity" />
            </Resizable.Handle>
            <Resizable.Panel defaultSize="50%" min="20%" class={`${panelClass} bg-muted/50`}>
              Console
            </Resizable.Panel>
          </Resizable>
        </Resizable.Panel>
      </Resizable>
    </div>
  )
}

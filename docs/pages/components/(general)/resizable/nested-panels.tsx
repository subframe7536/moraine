import { Icon, Resizable } from '@src'

const panelClass = 'text-xs text-muted-foreground p-4 flex h-full items-center justify-center'

export function NestedPanels() {
  return (
    <div class="b-1 b-border border-border h-72 max-w-lg w-full overflow-hidden rounded-xl">
      <Resizable defaultValue={['32%', '68%']}>
        <Resizable.Panel min="20%" class={`${panelClass} bg-muted`}>
          Sidebar
        </Resizable.Panel>
        <Resizable.Handle intersection />
        <Resizable.Panel min="35%">
          <Resizable orientation="vertical" defaultValue={['50%', '50%']}>
            <Resizable.Panel min="25%" class={panelClass}>
              Editor
            </Resizable.Panel>
            <Resizable.Handle intersection>
              <Icon name="i-lucide:activity" />
            </Resizable.Handle>
            <Resizable.Panel min="20%" class={`${panelClass} bg-muted/50`}>
              Console
            </Resizable.Panel>
          </Resizable>
        </Resizable.Panel>
      </Resizable>
    </div>
  )
}

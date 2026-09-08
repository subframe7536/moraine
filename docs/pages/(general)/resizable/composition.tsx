import { Resizable } from '@src'

const panelClass = 'text-xs text-muted-foreground flex h-full items-center justify-center'

export function Composition() {
  return (
    <div class="b-(1 border) rounded-xl h-48 w-full overflow-hidden">
      <Resizable>
        <Resizable.Panel defaultSize="35%" class={`${panelClass} bg-muted/20`}>
          Navigation
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel>
          <Resizable orientation="vertical">
            <Resizable.Panel defaultSize="60%" class={panelClass}>
              Editor workspace
            </Resizable.Panel>
            <Resizable.Handle />
            <Resizable.Panel class={`${panelClass} bg-muted/10`}>Terminal output</Resizable.Panel>
          </Resizable>
        </Resizable.Panel>
      </Resizable>
    </div>
  )
}

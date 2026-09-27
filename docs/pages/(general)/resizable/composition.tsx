import { Resizable } from '@src'

const panelClass = 'text-xs text-muted-foreground flex h-full items-center justify-center'

export function Composition() {
  return (
    <div class="b-(1 border) h-48 w-full overflow-hidden rounded-xl">
      <Resizable defaultValue={['35%', '65%']}>
        <Resizable.Panel class={`${panelClass} bg-muted/20`}>Navigation</Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel>
          <Resizable orientation="vertical" defaultValue={['60%', '40%']}>
            <Resizable.Panel class={panelClass}>Editor workspace</Resizable.Panel>
            <Resizable.Handle />
            <Resizable.Panel class={`${panelClass} bg-muted/10`}>Terminal output</Resizable.Panel>
          </Resizable>
        </Resizable.Panel>
      </Resizable>
    </div>
  )
}

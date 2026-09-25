import { Resizable } from '@src'

export function Constraints() {
  return (
    <div class="b-(1 border) h-40 w-full overflow-hidden rounded-xl">
      <Resizable>
        <Resizable.Panel
          defaultSize="30%"
          min="20%"
          max="50%"
          class="text-muted-foreground p-4 bg-muted/20 flex items-center justify-center text-xs"
        >
          Sidebar (20% - 50%)
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel class="text-muted-foreground p-4 flex items-center justify-center text-xs">
          Main content area
        </Resizable.Panel>
      </Resizable>
    </div>
  )
}

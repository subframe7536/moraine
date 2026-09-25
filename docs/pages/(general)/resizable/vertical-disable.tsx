import { Resizable } from '@src'

function Stack(props: { disable?: boolean }) {
  return (
    <Resizable disable={props.disable} orientation="vertical" classes={{ handle: 'bg-accent/80' }}>
      <Resizable.Panel defaultSize="33%" class="p-4 bg-muted">
        Top
      </Resizable.Panel>
      <Resizable.Handle />
      <Resizable.Panel defaultSize="34%" min="30%" class="p-4 bg-background">
        Middle
      </Resizable.Panel>
      <Resizable.Handle />
      <Resizable.Panel defaultSize="33%" class="p-4 bg-muted">
        Bottom
      </Resizable.Panel>
    </Resizable>
  )
}

export function VerticalDisable() {
  return (
    <div class="gap-4 grid md:grid-cols-2">
      <div class="b-1 b-border border-border h-72 overflow-hidden rounded-xl">
        <Stack />
      </div>
      <div class="b-1 b-border border-border opacity-80 h-72 overflow-hidden rounded-xl">
        <Stack disable />
      </div>
    </div>
  )
}

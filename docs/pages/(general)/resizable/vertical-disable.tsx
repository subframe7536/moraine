import { Resizable } from '@src'

function Stack(props: { disabled?: boolean }) {
  return (
    <Resizable
      disabled={props.disabled}
      orientation="vertical"
      defaultValue={['33%', '34%', '33%']}
      classes={{ handle: 'bg-accent/80' }}
    >
      <Resizable.Panel class="p-4 bg-muted">Top</Resizable.Panel>
      <Resizable.Handle />
      <Resizable.Panel min="30%" class="p-4 bg-background">
        Middle
      </Resizable.Panel>
      <Resizable.Handle />
      <Resizable.Panel class="p-4 bg-muted">Bottom</Resizable.Panel>
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
        <Stack disabled />
      </div>
    </div>
  )
}

import { Accordion, Input } from '@src'

export function ContentLifetime() {
  return (
    <div class="max-w-md w-full">
      <Accordion
        collapsible
        mountMode="keep-mounted"
        defaultValue={['settings']}
        items={[
          {
            value: 'settings',
            label: 'Persistent form state',
            contentRender: (
              <div class="py-2 space-y-2">
                <p class="text-xs text-muted-foreground">
                  Inputs retain their state across open/close toggles.
                </p>
                <Input placeholder="Preserved input text" defaultValue="Draft notes" />
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

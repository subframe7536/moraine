import { Button, Card } from '@src'

export function Sizes() {
  return (
    <div class="flex gap-2">
      <Card
        compact
        title="Small Card"
        description="Compact"
        footer={<Button size="sm">Action</Button>}
        classes={{ root: 'max-w-xs h-fit' }}
      >
        <p class="text-sm opacity-85">Compact spacing for dense layouts and sidebars.</p>
      </Card>

      <Card
        title="Default Card"
        description="Default"
        footer={<Button size="sm">Action</Button>}
        classes={{ root: 'max-w-xs h-fit' }}
      >
        <p class="text-sm opacity-85">Standard spacing for normal form and dashboard cards.</p>
      </Card>
    </div>
  )
}

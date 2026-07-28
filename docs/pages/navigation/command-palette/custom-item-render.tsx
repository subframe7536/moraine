import { Badge, Button, CommandPalette, Dialog, Icon } from '@src'
import type { CommandPaletteT } from '@src'
import { createSignal } from 'solid-js'

interface TeamCommand extends CommandPaletteT.Item {
  owner: string
  status: 'ready' | 'blocked'
}

const GROUPS: CommandPaletteT.Group<TeamCommand>[] = [
  {
    id: 'projects',
    label: 'Projects',
    items: [
      {
        value: 'moraine-docs',
        label: 'Moraine Docs',
        description: 'Update examples for the next release',
        owner: 'Design Systems',
        status: 'ready',
      },
      {
        value: 'billing-api',
        label: 'Billing API',
        description: 'Waiting on staging credentials',
        owner: 'Platform',
        status: 'blocked',
      },
    ],
  },
]

export function CustomItemRender() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="max-w-full w-lg">
      <Dialog
        open={open()}
        onOpenChange={setOpen}
        close={false}
        classes={{ body: 'p-0 mb-0' }}
        body={
          <CommandPalette<TeamCommand>
            groups={GROUPS}
            onClose={() => setOpen(false)}
            itemRender={(ctx) => (
              <div class="flex flex-1 gap-3 min-w-0 items-center">
                <Icon name="i-lucide-folder-kanban text-muted-foreground shrink-0" />
                <span class="flex flex-1 flex-col min-w-0">
                  <span class="text-sm font-medium truncate">{ctx.item.label}</span>
                  <span class="text-xs text-muted-foreground truncate">
                    {ctx.item.owner} · {ctx.item.description}
                  </span>
                </span>
                <Badge variant={ctx.item.status === 'ready' ? 'default' : 'outline'}>
                  {ctx.item.status}
                </Badge>
              </div>
            )}
          />
        }
      >
        <Button variant="outline">Open project switcher</Button>
      </Dialog>
    </div>
  )
}

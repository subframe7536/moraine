import { Icon, KbdGroup } from '@src'
export function CustomSeparator() {
  return (
    <div class="flex gap-2 items-center">
      <span class="text-sm text-muted-foreground">Open command palette:</span>
      <KbdGroup
        items={['ctrl', 'shift', 'P']}
        separator={() => <Icon name="i-lucide:plus" class="text-muted-foreground" />}
      />
    </div>
  )
}

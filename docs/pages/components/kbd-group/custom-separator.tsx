import { KbdGroup } from '@src'

export function CustomSeparator() {
  return (
    <KbdGroup
      items={['Ctrl', 'Shift', 'K']}
      separator={() => <span class="text-muted-foreground">/</span>}
    />
  )
}

import { KbdGroup } from '@src'

export function CustomSeparator() {
  return (
    <KbdGroup
      items={[{ value: 'Ctrl', label: 'Control' }, 'Shift', 'K']}
      separator={<span class="text-muted-foreground">/</span>}
    />
  )
}

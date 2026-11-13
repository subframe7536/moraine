import { KbdGroup } from '@src'

export function CustomSeparator() {
  return (
    <KbdGroup
      items={['Ctrl', 'Shift', 'K']}
      separatorRender={() => <span class="text-muted-foreground">/</span>}
    />
  )
}

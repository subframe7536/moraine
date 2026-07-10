import { KbdGroup } from '@src'

export function CustomDividers() {
  return (
    <KbdGroup
      sequence={[
        [{ value: 'Ctrl', label: 'Control' }, 'K'],
        ['Ctrl', 'S'],
      ]}
      divider={<span class="text-xs text-muted-foreground">+</span>}
      sequenceDivider={<span class="text-xs text-muted-foreground">then</span>}
    />
  )
}

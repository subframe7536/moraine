import { KbdGroup } from '@src'

export function CustomDividers() {
  return (
    <KbdGroup
      sequence={[
        [{ value: 'Ctrl', label: 'Control' }, 'K'],
        ['Ctrl', 'S'],
      ]}
      separatorRender={() => <span class="text-xs text-muted-foreground">/</span>}
      sequenceSeparatorRender={() => <span class="text-xs text-muted-foreground"> & </span>}
    />
  )
}

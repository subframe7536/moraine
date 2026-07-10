import { KbdGroup } from '@src'

export function CustomDividers() {
  return (
    <KbdGroup
      sequence={[
        [{ value: 'Ctrl', label: 'Control' }, 'K'],
        ['Ctrl', 'S'],
      ]}
      dividerRender={() => <span class="text-xs text-muted-foreground">/</span>}
      sequenceDividerRender={() => <span class="text-xs text-muted-foreground"> & </span>}
    />
  )
}

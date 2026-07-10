import { KbdGroup } from '@src'

export function Sequences() {
  return (
    <KbdGroup
      sequence={[
        [{ value: 'Ctrl', label: 'Control' }, 'K'],
        ['Ctrl', 'S'],
      ]}
    />
  )
}

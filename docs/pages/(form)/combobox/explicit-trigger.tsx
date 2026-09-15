import { Combobox } from '@src'

export function ExplicitTrigger() {
  return (
    <Combobox
      class="max-w-xs"
      items={[
        { label: 'Development', value: 'dev' },
        { label: 'Design', value: 'design' },
      ]}
      openOnControlClick={false}
      placeholder="Use the trailing button"
    />
  )
}

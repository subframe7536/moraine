import { renderToString } from 'solid-js/web'

import { BaseSelect } from './base-select.tsx'
export function renderBaseSelectFixture(): string {
  return renderToString(() => (
    <BaseSelect id="primitive" name="choice" items={[{ value: 1, label: 'One' }]} defaultValue={1}>
      <BaseSelect.Trigger>{(state) => state.selectedItems[0]?.label}</BaseSelect.Trigger>
      <BaseSelect.Content>
        <BaseSelect.Listbox>
          <BaseSelect.Item item={{ value: 1, label: 'One' }} />
        </BaseSelect.Listbox>
        <BaseSelect.Empty>Empty</BaseSelect.Empty>
      </BaseSelect.Content>
    </BaseSelect>
  ))
}

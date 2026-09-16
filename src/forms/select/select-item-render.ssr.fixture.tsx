import { renderToString } from 'solid-js/web'

import { Select } from './select.tsx'

export function renderSelectItemRenderFixture(): string {
  return renderToString(() => (
    <Select
      id="custom-render"
      items={[
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ]}
      defaultOpen
      itemRender={(state) => <span data-testid="custom-item">{state.item.label}</span>}
    />
  ))
}

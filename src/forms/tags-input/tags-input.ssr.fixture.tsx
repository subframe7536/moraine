import { renderToString } from 'solid-js/web'

import { TagsInput } from './tags-input.tsx'

export function renderTagsInputFixture(): string {
  return renderToString(() => (
    <TagsInput id="tags" name="tags" defaultValue={['alpha', 'beta']} allowClear />
  ))
}

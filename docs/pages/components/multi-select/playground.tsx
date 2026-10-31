import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const TOPICS: MultiSelectT.Entry[] = [
  {
    type: 'group',
    label: 'Product',
    items: [
      {
        label: 'Design',
        description: 'Interface and visual design',
        value: 'design',
        icon: 'i-lucide:palette',
      },
      { label: 'Product', value: 'product', icon: 'i-lucide:layers' },
      { label: 'Development', value: 'dev', icon: 'i-lucide:code' },
    ],
  },
  { type: 'separator' },
  {
    type: 'group',
    label: 'Go-to-market',
    items: [
      { label: 'Marketing', value: 'marketing', icon: 'i-lucide:megaphone' },
      { label: 'Research', value: 'research', icon: 'i-lucide:search' },
    ],
  },
]

export default function MultiSelectPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'outline',
          options: [
            { label: 'Outline', value: 'outline' },
            { label: 'Subtle', value: 'subtle' },
            { label: 'Ghost', value: 'ghost' },
            { label: 'None', value: 'none' },
          ],
        },
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
        { kind: 'switch', prop: 'empty', label: 'Empty list', defaultValue: false },
        { kind: 'switch', prop: 'search', label: 'Search', defaultValue: true },
        {
          kind: 'switch',
          prop: 'openOnControlClick',
          label: 'Open on control click',
          defaultValue: true,
        },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
      ]}
    >
      {(props) => (
        <div class="max-w-96 min-w-40 w-3/5">
          <MultiSelect
            items={props.empty ? [] : TOPICS}
            defaultValue={['design', 'dev']}
            leadingIcon="i-lucide:tags"
            allowClear
            maxTagCount={1}
            placeholder="Select topics..."
            variant={props.variant}
            size={props.size}
            search={props.search}
            openOnControlClick={props.openOnControlClick}
            disabled={props.disabled}
          />
        </div>
      )}
    </DocsPlayground>
  )
}

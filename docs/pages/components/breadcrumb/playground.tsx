import { Breadcrumb } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const TRAIL_ITEMS = [
  { label: 'Home', href: '#', icon: 'i-lucide:home' },
  { label: 'Projects', href: '#' },
  { label: 'Design System', href: '#' },
  { label: 'Components' },
]

export default function BreadcrumbPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'input',
          prop: 'separator',
          label: 'Separator',
          defaultValue: 'i-lucide:chevron-right',
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
        { kind: 'switch', prop: 'wrap', label: 'Wrap items', defaultValue: false },
      ]}
    >
      {(props) => (
        <Breadcrumb
          items={TRAIL_ITEMS}
          separator={props.separator || 'i-lucide:chevron-right'}
          wrap={props.wrap}
          size={props.size}
        />
      )}
    </DocsPlayground>
  )
}

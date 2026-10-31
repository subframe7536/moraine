import { Avatar } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function AvatarPlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'input', prop: 'text', label: 'Fallback text', defaultValue: 'SC' },
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
      ]}
    >
      {(props) => (
        <div class="flex gap-4 items-center">
          <Avatar
            alt="Sarah Connor"
            text={props.text}
            size={props.size}
            badge="i-lucide:check"
            badgePosition="bottom-right"
          />
        </div>
      )}
    </DocsPlayground>
  )
}

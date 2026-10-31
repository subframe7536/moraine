import { AvatarGroup } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const MEMBERS = [
  {
    src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    alt: 'Sarah Connor',
    text: 'SC',
  },
  {
    alt: 'John Doe',
    text: 'JD',
    badge: 'icon-check',
  },
  {
    alt: 'Emily Davis',
    text: 'ED',
    fallback: 'i-lucide:user',
  },
  {
    src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    alt: 'Michael Scott',
    text: 'MS',
  },
  {
    src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    alt: 'Jane Wilson',
    text: 'JW',
  },
]

export default function AvatarGroupPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'input',
          prop: 'max',
          label: 'Visible avatars',
          defaultValue: 3,
          inputType: 'number',
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
      ]}
    >
      {(props) => <AvatarGroup max={props.max} size={props.size} items={MEMBERS} />}
    </DocsPlayground>
  )
}

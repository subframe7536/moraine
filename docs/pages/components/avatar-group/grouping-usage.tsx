import { AvatarGroup } from '@src'

export function GroupingUsage() {
  return (
    <AvatarGroup
      max={3}
      items={[
        {
          src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&fit=crop&q=80',
          alt: 'Sarah Connor',
          text: 'SC',
        },
        {
          src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&fit=crop&q=80',
          alt: 'Marcus Vance',
          text: 'MV',
        },
        {
          src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&fit=crop&q=80',
          alt: 'Elena Rostova',
          text: 'ER',
        },
        {
          src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&fit=crop&q=80',
          alt: 'Michael Scott',
          text: 'MS',
        },
        {
          src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&fit=crop&q=80',
          alt: 'Jane Wilson',
          text: 'JW',
        },
      ]}
    />
  )
}

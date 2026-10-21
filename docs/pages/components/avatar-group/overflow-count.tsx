import { AvatarGroup } from '@src'

const REVIEWERS = [
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
    alt: 'Elena Rostova',
    text: 'ER',
    fallback: 'i-lucide:user',
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
]

export function OverflowCount() {
  return (
    <div class="space-y-4">
      <div class="space-y-1.5">
        <p class="text-xs text-muted-foreground">Faces plus remainder</p>
        <AvatarGroup max={3} items={REVIEWERS} />
      </div>
      <div class="space-y-1.5">
        <p class="text-xs text-muted-foreground">Count only</p>
        <AvatarGroup max={0} items={REVIEWERS} />
      </div>
    </div>
  )
}

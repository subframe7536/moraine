import { Avatar } from '@src'
import type { AvatarT } from '@src'

export interface AvatarPlaygroundProps {
  alt?: string
  text?: string
  size?: AvatarT.Variant['size']
}

export function AvatarPlayground(props: AvatarPlaygroundProps) {
  return (
    <div class="flex gap-4 items-center">
      <Avatar
        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
        alt={props.alt ?? 'Sarah Connor'}
        text={props.text ?? 'SC'}
        size={props.size ?? 'md'}
        badge="i-lucide:check"
        badgePosition="bottom-right"
      />
    </div>
  )
}

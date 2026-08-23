import { Avatar, AvatarGroup } from '@src'
import type { AvatarGroupT } from '@src'

export interface AvatarGroupPlaygroundProps {
  max?: number
  size?: AvatarGroupT.Variant['size']
}

export function AvatarGroupPlayground(props: AvatarGroupPlaygroundProps) {
  return (
    <AvatarGroup max={props.max ?? 3} size={props.size ?? 'md'}>
      <Avatar
        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
        alt="Sarah Connor"
        text="SC"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
        alt="John Doe"
        text="JD"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
        alt="Emily Davis"
        text="ED"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
        alt="Michael Scott"
        text="MS"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80"
        alt="Jane Wilson"
        text="JW"
      />
    </AvatarGroup>
  )
}

import { Avatar, Badge } from '@src'
import type { AvatarT } from '@src'
import { createSignal } from 'solid-js'

export function LoadingUsage() {
  const [status, setStatus] = createSignal<AvatarT.Status>('idle')

  return (
    <div class="flex gap-4 items-center">
      <Avatar
        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&fit=crop&q=80"
        alt="Sarah Connor"
        onStatusChange={setStatus}
      />
      <Badge variant={status() === 'loaded' ? 'default' : 'outline'}>Status: {status()}</Badge>
    </div>
  )
}

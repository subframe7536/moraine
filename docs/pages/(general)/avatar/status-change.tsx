import { Avatar } from '@src'
import type { AvatarT } from '@src'
import { createSignal } from 'solid-js'

export function StatusChange() {
  const [status, setStatus] = createSignal<AvatarT.Status>('idle')

  return (
    <div class="flex gap-3 items-center">
      <Avatar
        src="/avatar-does-not-exist.png"
        alt="Taylor Kim"
        onStatusChange={setStatus}
        fallback="i-lucide-user"
      />
      <p class="text-sm text-muted-foreground">Image status: {status()}</p>
    </div>
  )
}

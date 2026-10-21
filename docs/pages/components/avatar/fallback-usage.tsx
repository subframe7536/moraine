import { Avatar } from '@src'

export function FallbackUsage() {
  return (
    <div class="flex gap-4 items-center">
      <Avatar
        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&fit=crop&q=80"
        alt="Sarah Connor"
        text="SC"
      />
      <Avatar src="/invalid-image-path.jpg" alt="Alex Rivera" text="AR" />
      <Avatar alt="Guest User" />
    </div>
  )
}

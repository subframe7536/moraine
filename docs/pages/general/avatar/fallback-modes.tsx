import { Avatar } from '@src'

export function FallbackModes() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Avatar text="MR" />
      <Avatar alt="Moraine Team" />
      <Avatar fallback="i-lucide-user" />
    </div>
  )
}

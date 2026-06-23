import { Avatar } from '@src'

export function FallbackModes() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Avatar items={[{ text: 'MR' }]} />
      <Avatar items={[{ alt: 'Moraine Team' }]} />
      <Avatar items={[{ fallback: 'i-lucide-user' }]} />
    </div>
  )
}

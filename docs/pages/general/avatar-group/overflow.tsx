import { AvatarGroup } from '@src'

export function Overflow() {
  return (
    <AvatarGroup
      max={3}
      items={[
        { text: 'AL' },
        { text: 'BM' },
        { text: 'CN', badge: 'i-lucide-check', badgePosition: 'top-right' },
        { text: 'DO' },
        { text: 'EP' },
      ]}
    />
  )
}

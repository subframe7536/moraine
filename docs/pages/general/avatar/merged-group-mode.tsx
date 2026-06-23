import { Avatar } from '@src'

export function MergedGroupMode() {
  const IMAGE_A = createSvgDataUrl('A', '#3f3f46')

  const IMAGE_B = createSvgDataUrl('B', '#18181b')

  function createSvgDataUrl(label: string, backgroundColor: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${backgroundColor}"/><text x="32" y="38" text-anchor="middle" fill="white" font-family="sans-serif" font-size="24">${label}</text></svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  return (
    <div class="flex flex-col gap-3">
      <Avatar
        size="md"
        max={3}
        items={[
          { src: IMAGE_A, alt: 'Alpha' },
          { src: IMAGE_B, alt: 'Beta' },
          { text: 'CD' },
          { text: 'EF', icon: 'i-lucide-flask-conical', badgePosition: 'top-right' },
          { alt: 'Echo Foxtrot' },
        ]}
      />

      <Avatar size="sm" items={[{ text: 'A' }, { text: 'B' }, { text: 'C' }]} />
    </div>
  )
}

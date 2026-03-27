import { Avatar } from '@src'
import { createSignal } from 'solid-js'

export function SingleAvatar() {
  const IMAGE_A = createSvgDataUrl('A', '#3f3f46')

  const IMAGE_B = createSvgDataUrl('B', '#18181b')

  const [source, setSource] = createSignal(IMAGE_A)

  function createSvgDataUrl(label: string, backgroundColor: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${backgroundColor}"/><text x="32" y="38" text-anchor="middle" fill="white" font-family="sans-serif" font-size="24">${label}</text></svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  return (
    <div class="flex gap-4 items-center">
      <Avatar
        items={[{ src: source(), alt: 'Moraine' }]}
        classes={{
          root: 'ring-ring',
        }}
      />

      <button
        type="button"
        class="text-sm px-3 py-2 b-1 b-border border-border rounded-md bg-background hover:bg-muted"
        onClick={() => {
          setSource((current) => (current === IMAGE_A ? IMAGE_B : IMAGE_A))
        }}
      >
        Swap Source
      </button>
    </div>
  )
}

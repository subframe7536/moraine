import { createSignal } from 'solid-js'

import { Avatar } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function SingleAvatar() {
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
        items={[{ src: source(), alt: 'Flint UI' }]}
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

function FallbackModes() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Avatar items={[{ text: 'FL' }]} />
      <Avatar items={[{ alt: 'Flint UI Team' }]} />
      <Avatar items={[{ fallback: 'i-lucide-user' }]} />
    </div>
  )
}

function BadgePositions() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Avatar items={[{ text: 'A', icon: 'i-lucide-check', badgePosition: 'top-left' }]} />
      <Avatar items={[{ text: 'B', icon: 'i-lucide-check', badgePosition: 'top-right' }]} />
      <Avatar items={[{ text: 'C', icon: 'i-lucide-check', badgePosition: 'bottom-left' }]} />
      <Avatar items={[{ text: 'D', icon: 'i-lucide-check', badgePosition: 'bottom-right' }]} />
    </div>
  )
}

function MergedGroupMode() {
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

export default () => {
  return (
    <DemoPage componentKey="avatar">
      <DemoSection
        title="Single Avatar"
        description="Fallback first, then image crossfades in after preload."
        demo={SingleAvatar}
      />

      <DemoSection
        title="Fallback Modes"
        description="Text, initials-from-alt and fallback icon."
        demo={FallbackModes}
      />

      <DemoSection
        title="Badge Positions"
        description="Top/bottom + left/right corner badge."
        demo={BadgePositions}
      />

      <DemoSection
        title="Merged Group Mode"
        description="Use the same Avatar component with items."
        demo={MergedGroupMode}
      />
    </DemoPage>
  )
}

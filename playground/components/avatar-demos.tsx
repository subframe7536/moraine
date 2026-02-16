import { For } from 'solid-js'

import { Avatar, AvatarGroup, Chip } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

const AVATAR_SIZES = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const

const CHIP_COLORS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
] as const

const CHIP_POSITIONS = ['top-right', 'bottom-right', 'top-left', 'bottom-left'] as const

const avatarUrl = (id: number) => `https://i.pravatar.cc/100?img=${id}`

export const AvatarDemos = () => (
  <DemoPage
    eyebrow="Rock UI Playground"
    title="Avatar & Chip"
    description="Avatar display with image, fallback, groups, and chip status indicators."
  >
    <DemoSection title="Avatar Sizes" description="All nine sizes from 3xs to 3xl.">
      <div class="flex flex-wrap gap-3 items-end">
        <For each={AVATAR_SIZES}>
          {(size) => (
            <div class="flex flex-col gap-1 items-center">
              <Avatar size={size} src={avatarUrl(1)} alt="Jane Doe" />
              <span class="text-[10px] text-zinc-500">{size}</span>
            </div>
          )}
        </For>
      </div>
    </DemoSection>

    <DemoSection
      title="Avatar Fallbacks"
      description="Fallback chain: image → alt initials → text → icon."
    >
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex flex-col gap-1 items-center">
          <Avatar size="lg" src={avatarUrl(2)} alt="Image" />
          <span class="text-[10px] text-zinc-500">Image</span>
        </div>
        <div class="flex flex-col gap-1 items-center">
          <Avatar size="lg" alt="Jane Doe" />
          <span class="text-[10px] text-zinc-500">Alt initials</span>
        </div>
        <div class="flex flex-col gap-1 items-center">
          <Avatar size="lg" text="AB" />
          <span class="text-[10px] text-zinc-500">Text</span>
        </div>
        <div class="flex flex-col gap-1 items-center">
          <Avatar size="lg" icon="i-lucide-user" />
          <span class="text-[10px] text-zinc-500">Icon</span>
        </div>
        <div class="flex flex-col gap-1 items-center">
          <Avatar size="lg" src="/broken.jpg" alt="Broken" />
          <span class="text-[10px] text-zinc-500">Broken src</span>
        </div>
      </div>
    </DemoSection>

    <DemoSection title="Avatar with Chip" description="Status indicators overlaid on avatars.">
      <div class="flex flex-wrap gap-6 items-center">
        <Avatar size="lg" src={avatarUrl(3)} alt="Online" chip />
        <Avatar size="lg" src={avatarUrl(4)} alt="Success" chip={{ color: 'success' }} />
        <Avatar size="lg" src={avatarUrl(5)} alt="Error" chip={{ color: 'error' }} />
        <Avatar
          size="lg"
          src={avatarUrl(6)}
          alt="Bottom-right"
          chip={{ color: 'warning', position: 'bottom-right' }}
        />
      </div>
    </DemoSection>

    <DemoSection title="Avatar Group" description="Overlapping avatars with max overflow.">
      <div class="space-y-4">
        <div class="space-y-1">
          <label class="text-xs text-zinc-500 block">max=3 (5 total)</label>
          <AvatarGroup max={3}>
            <Avatar src={avatarUrl(10)} alt="A" />
            <Avatar src={avatarUrl(11)} alt="B" />
            <Avatar src={avatarUrl(12)} alt="C" />
            <Avatar src={avatarUrl(13)} alt="D" />
            <Avatar src={avatarUrl(14)} alt="E" />
          </AvatarGroup>
        </div>
        <div class="space-y-1">
          <label class="text-xs text-zinc-500 block">size=lg, no max</label>
          <AvatarGroup size="lg">
            <Avatar src={avatarUrl(20)} alt="A" />
            <Avatar src={avatarUrl(21)} alt="B" />
            <Avatar src={avatarUrl(22)} alt="C" />
          </AvatarGroup>
        </div>
      </div>
    </DemoSection>

    <DemoSection title="Chip Colors" description="All seven color variants as standalone chips.">
      <div class="flex flex-wrap gap-3 items-center">
        <For each={CHIP_COLORS}>
          {(color) => (
            <div class="flex flex-col gap-1 items-center">
              <Chip color={color} standalone />
              <span class="text-[10px] text-zinc-500">{color}</span>
            </div>
          )}
        </For>
      </div>
    </DemoSection>

    <DemoSection title="Chip Positions" description="Chip placement on each avatar corner.">
      <div class="flex flex-wrap gap-6 items-center">
        <For each={CHIP_POSITIONS}>
          {(position) => (
            <div class="flex flex-col gap-1 items-center">
              <Avatar
                size="lg"
                src={avatarUrl(30)}
                alt={position}
                chip={{ color: 'success', position, inset: true }}
              />
              <span class="text-[10px] text-zinc-500">{position}</span>
            </div>
          )}
        </For>
      </div>
    </DemoSection>

    <DemoSection title="Chip with Text" description="Chips displaying numeric or text content.">
      <div class="flex flex-wrap gap-6 items-center">
        <Avatar
          size="xl"
          src={avatarUrl(31)}
          alt="Notifications"
          chip={{ color: 'error', text: 3, inset: true }}
        />
        <Avatar
          size="xl"
          src={avatarUrl(32)}
          alt="New"
          chip={{ color: 'primary', text: 'new', size: 'md', inset: true }}
        />
        <Chip color="info" standalone text={42} size="lg" />
      </div>
    </DemoSection>
  </DemoPage>
)

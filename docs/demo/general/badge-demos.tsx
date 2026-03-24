import { For, createSignal } from 'solid-js'

import { Badge, Button } from '../../../src'
import type { BadgeT } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Variants() {
  const VARIANTS: BadgeVariantName[] = ['default', 'outline', 'solid']

  type BadgeVariantName = Exclude<BadgeT.Variant['variant'], undefined>

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={VARIANTS}>{(variant) => <Badge variant={variant}>{variant}</Badge>}</For>
    </div>
  )
}

function Sizes() {
  const SIZES: BadgeSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

  type BadgeSizeName = Exclude<BadgeT.Variant['size'], undefined>

  return (
    <div class="font-mono flex flex-wrap gap-3 items-center">
      <For each={SIZES}>
        {(size) => (
          <Badge size={size} variant="outline">
            {size}
          </Badge>
        )}
      </For>
    </div>
  )
}

function StatusAndMetadata() {
  const SIZES: BadgeSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

  type BadgeSizeName = Exclude<BadgeT.Variant['size'], undefined>

  return (
    <div class="space-y-2">
      <For each={SIZES}>
        {(size) => (
          <div class="flex flex-wrap gap-3 items-center">
            <Badge variant="solid" size={size} leading="i-lucide-check-check">
              Published
            </Badge>
            <Badge variant="default" size={size}>
              测试
            </Badge>
            <Badge variant="outline" size={size} trailing="i-lucide-git-branch">
              v0.1.0
            </Badge>
            <Badge variant="outline" size={size} leading="i-lucide-users">
              24 contributors
            </Badge>
          </div>
        )}
      </For>
    </div>
  )
}

function DismissibleTags() {
  const INITIAL_TAGS = ['Design', 'SolidJS', 'Kobalte', 'UnoCSS']

  const [tags, setTags] = createSignal(INITIAL_TAGS)

  return (
    <div class="flex flex-col gap-3 items-start">
      <div class="flex flex-wrap gap-2 max-w-2xl">
        <For each={tags()}>
          {(tag) => (
            <Badge
              variant="default"
              trailing="icon-close"
              title={tag}
              classes={{
                root: 'pe-0',
                trailing: 'hover:bg-accent rounded',
              }}
              onTrailingClick={() => setTags((current) => current.filter((item) => item !== tag))}
            >
              {tag}
            </Badge>
          )}
        </For>
      </div>

      <Button size="sm" variant="outline" onClick={() => setTags(INITIAL_TAGS)}>
        Reset tags
      </Button>
    </div>
  )
}

export default () => {
  return (
    <DemoPage componentKey="badge">
      <DemoSection
        title="Variants"
        description="Default, outline, and solid styles."
        demo={Variants}
      />

      <DemoSection
        title="Sizes"
        description="Size scale with leading and trailing icons."
        demo={Sizes}
      />

      <DemoSection
        title="Status and metadata"
        description="Common badge content for pills, counters, and status labels."
        demo={StatusAndMetadata}
      />

      <DemoSection
        title="Dismissible tags"
        description="Clickable trailing icons support removable tag UIs like Select multi-value chips."
        demo={DismissibleTags}
      />
    </DemoPage>
  )
}

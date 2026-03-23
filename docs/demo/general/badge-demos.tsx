import { For, createSignal } from 'solid-js'

import { Badge, Button } from '../../../src'
import type { BadgeVariantProps } from '../../../src/elements/badge/badge.class'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

type BadgeVariantName = Exclude<BadgeVariantProps['variant'], undefined>
type BadgeSizeName = Exclude<BadgeVariantProps['size'], undefined>

const VARIANTS: BadgeVariantName[] = ['default', 'outline', 'solid']
const SIZES: BadgeSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']
const INITIAL_TAGS = ['Design', 'SolidJS', 'Kobalte', 'UnoCSS']

export default () => {
  const [tags, setTags] = createSignal(INITIAL_TAGS)

  return (
    <DemoPage componentKey="badge">
      <DemoSection title="Variants" description="Default, outline, and solid styles.">
        <div class="flex flex-wrap gap-3 items-center">
          <For each={VARIANTS}>{(variant) => <Badge variant={variant}>{variant}</Badge>}</For>
        </div>
      </DemoSection>

      <DemoSection title="Sizes" description="Size scale with leading and trailing icons.">
        <div class="font-mono flex flex-wrap gap-3 items-center">
          <For each={SIZES}>
            {(size) => (
              <Badge size={size} variant="outline">
                {size}
              </Badge>
            )}
          </For>
        </div>
      </DemoSection>

      <DemoSection
        title="Status and metadata"
        description="Common badge content for pills, counters, and status labels."
      >
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
      </DemoSection>

      <DemoSection
        title="Dismissible tags"
        description="Clickable trailing icons support removable tag UIs like Select multi-value chips."
      >
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
                  onTrailingClick={() =>
                    setTags((current) => current.filter((item) => item !== tag))
                  }
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
      </DemoSection>
    </DemoPage>
  )
}

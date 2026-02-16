import { For, createSignal } from 'solid-js'

import { Select } from '../../src'
import type { SelectOption } from '../../src/select/select'

import { DemoPage, DemoSection } from './common/demo-page'

const FRUIT_OPTIONS: SelectOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry', disabled: true },
  { label: 'Forest', value: 'forest', icon: 'i-lucide:braces' },
]

const GROUPED_OPTIONS: SelectOption[] = [
  {
    label: 'Fruits',
    options: [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Cherry', value: 'cherry' },
    ],
  },
  {
    label: 'Vegetables',
    options: [
      { label: 'Carrot', value: 'carrot' },
      { label: 'Broccoli', value: 'broccoli' },
      { label: 'Spinach', value: 'spinach' },
    ],
  },
]

const VARIANTS = ['outline', 'soft', 'subtle', 'ghost'] as const
const SIZES = ['sm', 'md', 'lg'] as const

function makeOptions(count: number, offset = 0): SelectOption[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `Option ${offset + i + 1}`,
    value: `opt-${offset + i + 1}`,
  }))
}

export const SelectDemos = () => {
  const [singleValue, setSingleValue] = createSignal<string | null>(null)
  const [multiValue, setMultiValue] = createSignal<string[]>([])
  const [tagValues, setTagValues] = createSignal<string[]>([])
  const [createTagValues, setCreateTagValues] = createSignal<string[]>([])
  const [infiniteOptions, setInfiniteOptions] = createSignal<SelectOption[]>(makeOptions(20))
  const [loadingMore, setLoadingMore] = createSignal(false)

  return (
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Select"
      description="Single, multiple, and searchable selection with groups and custom rendering."
    >
      <DemoSection
        title="Single Select"
        description="Basic single selection with controlled value."
      >
        <div class="max-w-sm space-y-2">
          <Select
            options={FRUIT_OPTIONS}
            value={singleValue()}
            onChange={(v) => setSingleValue(v as string | null)}
            placeholder="Pick a fruit..."
            allowClear
          />
          <p class="text-xs text-zinc-500">Selected: {singleValue() ?? 'none'}</p>
        </div>
      </DemoSection>

      <DemoSection title="Multiple Select" description="Multi-selection with chips and allowClear.">
        <div class="max-w-sm space-y-2">
          <Select
            multiple
            options={FRUIT_OPTIONS}
            value={multiValue()}
            onChange={(v) => setMultiValue(v as string[])}
            placeholder="Pick fruits..."
            allowClear
          />
          <p class="text-xs text-zinc-500">Selected: {multiValue().join(', ') || 'none'}</p>
        </div>
      </DemoSection>

      <DemoSection
        title="Token Separators"
        description="Create and select tags when a separator is typed."
      >
        <div class="max-w-sm space-y-2">
          <Select
            multiple
            showSearch
            options={FRUIT_OPTIONS}
            value={tagValues()}
            onChange={(v) => setTagValues(v as string[])}
            tokenSeparators={[' ']}
            placeholder="Type text and press Space..."
          />
          <p class="text-xs text-zinc-500">Tags: {tagValues().join(', ') || 'none'}</p>
        </div>
      </DemoSection>

      <DemoSection
        title="Create New Tags"
        description="Type a new value and press Enter or click Create in the empty state."
      >
        <div class="max-w-sm space-y-2">
          <Select
            multiple
            showSearch
            options={FRUIT_OPTIONS}
            value={createTagValues()}
            onChange={(v) => setCreateTagValues(v as string[])}
            allowCreate
            placeholder="Type to create tags..."
            emptyRender={(ctx) => (
              <div class="p-2 text-center">
                <button
                  type="button"
                  class="text-sm text-primary cursor-pointer hover:underline"
                  onClick={() => ctx.create()}
                >
                  Create &ldquo;{ctx.inputValue}&rdquo;
                </button>
              </div>
            )}
          />
          <p class="text-xs text-zinc-500">Tags: {createTagValues().join(', ') || 'none'}</p>
        </div>
      </DemoSection>

      <DemoSection title="Searchable" description="Type to filter options.">
        <div class="max-w-sm">
          <Select
            options={FRUIT_OPTIONS}
            showSearch
            leadingIcon="i-lucide-search"
            placeholder="Search fruits..."
          />
        </div>
      </DemoSection>

      <DemoSection title="Grouped Options" description="Options organized in sections.">
        <div class="max-w-sm">
          <Select options={GROUPED_OPTIONS} placeholder="Pick an item..." />
        </div>
      </DemoSection>

      <DemoSection
        title="Max Count & Max Tag Count"
        description="Limit selections and visible chips."
      >
        <div class="gap-4 grid sm:grid-cols-2">
          <div class="space-y-1">
            <label class="text-xs text-zinc-500 block">maxCount=2</label>
            <Select multiple options={FRUIT_OPTIONS} maxCount={2} placeholder="Pick up to 2..." />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-zinc-500 block">maxTagCount=1 (value has 3)</label>
            <Select
              multiple
              options={FRUIT_OPTIONS}
              defaultValue={['apple', 'banana', 'cherry']}
              maxTagCount={1}
              placeholder="Pick..."
            />
          </div>
        </div>
      </DemoSection>

      <DemoSection title="Variants" description="Visual style variants.">
        <div class="gap-3 grid sm:grid-cols-2">
          <For each={VARIANTS}>
            {(variant) => (
              <Select options={FRUIT_OPTIONS} variant={variant} placeholder={variant} />
            )}
          </For>
        </div>
      </DemoSection>

      <DemoSection title="Sizes" description="Small, medium, and large.">
        <div class="gap-3 grid sm:grid-cols-3">
          <For each={SIZES}>
            {(size) => <Select options={FRUIT_OPTIONS} size={size} placeholder={`Size: ${size}`} />}
          </For>
        </div>
      </DemoSection>

      <DemoSection title="Disabled" description="Non-interactive state.">
        <div class="max-w-sm">
          <Select options={FRUIT_OPTIONS} disabled value="apple" placeholder="Pick..." />
        </div>
      </DemoSection>

      <DemoSection title="Infinite Scroll" description="Scroll to the bottom to load more options.">
        <div class="max-w-sm space-y-2">
          <Select
            options={infiniteOptions()}
            onScrollEnd={() => {
              if (loadingMore()) {
                return
              }
              setLoadingMore(true)
              setTimeout(() => {
                const next = infiniteOptions().length
                setInfiniteOptions((prev) => [...prev, ...makeOptions(10, next)])
                setLoadingMore(false)
              }, 1000)
            }}
            scrollEndThreshold={30}
            loading={loadingMore()}
            placeholder="Scroll to load more..."
          />
          <p class="text-xs text-zinc-500">Total options: {infiniteOptions().length}</p>
        </div>
      </DemoSection>
    </DemoPage>
  )
}

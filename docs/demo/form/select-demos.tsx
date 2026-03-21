import { For, createSignal } from 'solid-js'

import { MultiSelect, Select } from '../../../src'
import type { MultiSelectT } from '../../../src/forms/select/multi-select'
import type { SelectT } from '../../../src/forms/select/select'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const FRUIT_OPTIONS: SelectT.Items[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry', disabled: true },
  { label: 'Forest', value: 'forest', icon: 'i-lucide:braces' },
]

const GROUPED_OPTIONS: SelectT.Items[] = [
  {
    label: 'Fruits',
    children: [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Cherry', value: 'cherry' },
    ],
  },
  {
    label: 'Vegetables',
    children: [
      { label: 'Carrot', value: 'carrot' },
      { label: 'Broccoli', value: 'broccoli' },
      { label: 'Spinach', value: 'spinach' },
    ],
  },
]

const VARIANTS = ['outline', 'subtle', 'ghost', 'none'] as const
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

function makeOptions(count: number, offset = 0): SelectT.Items[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `Option ${offset + i + 1}`,
    value: `opt-${offset + i + 1}`,
  }))
}

export default () => {
  const [singleValue, setSingleValue] = createSignal<SelectT.Value | null>(null)
  const [multiValue, setMultiValue] = createSignal<MultiSelectT.Value[]>([])
  const [tagValues, setTagValues] = createSignal<MultiSelectT.Value[]>([])
  const [createTagValues, setCreateTagValues] = createSignal<MultiSelectT.Value[]>([])
  const [infiniteOptions, setInfiniteOptions] = createSignal<SelectT.Items[]>(makeOptions(20))
  const [loadingMore, setLoadingMore] = createSignal(false)

  return (
    <DemoPage componentKey="select">
      <DemoSection
        title="Single Select"
        description="Basic single selection with controlled value."
      >
        <div class="max-w-sm space-y-2">
          <Select
            options={FRUIT_OPTIONS}
            value={singleValue()}
            onChange={setSingleValue}
            placeholder="Pick a fruit..."
            allowClear
          />
          <p class="text-xs text-muted-foreground">Selected: {singleValue() ?? 'none'}</p>
        </div>
      </DemoSection>

      <DemoSection title="Multiple Select" description="Multi-selection with chips and allowClear.">
        <div class="max-w-sm space-y-2">
          <MultiSelect
            options={FRUIT_OPTIONS}
            value={multiValue()}
            onChange={setMultiValue}
            placeholder="Pick fruits..."
            allowClear
          />
          <p class="text-xs text-muted-foreground">Selected: {multiValue().join(', ') || 'none'}</p>
        </div>
      </DemoSection>

      <DemoSection
        title="Token Separators"
        description="Create and select tags when a separator is typed."
      >
        <div class="max-w-sm space-y-2">
          <MultiSelect
            search
            options={FRUIT_OPTIONS}
            value={tagValues()}
            onChange={setTagValues}
            tokenSeparators={[' ']}
            placeholder="Type text and press Space..."
          />
          <p class="text-xs text-muted-foreground">Tags: {tagValues().join(', ') || 'none'}</p>
        </div>
      </DemoSection>

      <DemoSection
        title="Create New Tags"
        description="Type a new value and press Enter or click Create in the empty state."
      >
        <div class="max-w-sm space-y-2">
          <MultiSelect
            search
            loading
            options={FRUIT_OPTIONS}
            value={createTagValues()}
            onChange={setCreateTagValues}
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
          <p class="text-xs text-muted-foreground">
            Tags: {createTagValues().join(', ') || 'none'}
          </p>
        </div>
      </DemoSection>

      <DemoSection title="Searchable" description="Type to filter options.">
        <div class="max-w-sm">
          <Select
            options={FRUIT_OPTIONS}
            search
            leadingIcon="i-lucide-search"
            placeholder="Search fruits..."
          />
        </div>
      </DemoSection>

      <DemoSection
        title="Trigger-only Open"
        description="Only the trigger icon can open the dropdown menu."
      >
        <div class="max-w-sm">
          <Select
            options={FRUIT_OPTIONS}
            preventAutoOpen
            placeholder="Click trigger icon to open..."
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
            <label class="text-xs text-muted-foreground block">maxCount=2</label>
            <MultiSelect options={FRUIT_OPTIONS} maxCount={2} placeholder="Pick up to 2..." />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground block">maxTagCount=1 (value has 3)</label>
            <MultiSelect
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

      <DemoSection title="Sizes" description="From xs to xl.">
        <div class="gap-3 grid md:grid-cols-5 sm:grid-cols-3">
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
            classes={{
              listbox: 'max-h-100',
            }}
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
          <p class="text-xs text-muted-foreground">Total options: {infiniteOptions().length}</p>
        </div>
      </DemoSection>
    </DemoPage>
  )
}

import { For } from 'solid-js'

import type { OnThisPageEntry } from '../hooks/use-table-of-contents'
import type { ItemDoc, SlotDoc } from '../vite-plugin/api-doc/types'
import type { FrontmatterData } from '../vite-plugin/markdown/types'

import type { DocsApiReferenceModel } from './docs-api-reference'
import { OnThisPage } from './on-this-page'
import { SegmentRenderer } from './segment-renderer'
import type { RenderSegment } from './types'

interface ComponentIndexEntry {
  name: string
  key: string
  category: string
  description?: string
  sourcePath?: string
  polymorphic: boolean
}

interface ComponentPropDoc {
  name: string
  required: boolean
  type: string
  description?: string
  defaultValue?: string
}

interface ComponentPropsDoc {
  own: ComponentPropDoc[]
  inherited: {
    from: string
    props: ComponentPropDoc[]
  }[]
}

export interface ExamplePageApiDoc {
  component: ComponentIndexEntry
  slots: SlotDoc[]
  props: ComponentPropsDoc
  items?: ItemDoc
}

export interface RenderExampleMarkdownPageInput {
  componentKey?: string
  frontmatter?: FrontmatterData
  apiDoc?: ExamplePageApiDoc
  apiReference?: DocsApiReferenceModel
  onThisPageEntries?: OnThisPageEntry[]
  segments: RenderSegment[]
}

export function Markdown(input: RenderExampleMarkdownPageInput) {
  return (
    <main class="text-foreground px-5 min-h-screen w-full sm:px-8">
      <div class="mx-auto flex gap-8 max-w-7xl items-start">
        <div class="mx-auto mb-24 max-w-4xl min-w-0 w-full">
          <For each={input.segments}>
            {(segment) => <SegmentRenderer segment={segment} pageContext={input} />}
          </For>
        </div>
        <OnThisPage entries={input.onThisPageEntries ?? []} />
      </div>
    </main>
  )
}

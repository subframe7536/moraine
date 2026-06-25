import type { Component } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { OnThisPageEntry } from '../hooks/use-table-of-contents'
import type { ItemDoc, SlotDoc } from '../build/api-doc/types'

import { createDocsMdxComponents } from './mdx-components'
import { OnThisPage } from './on-this-page'

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

export interface DocsMdxCodeTabItem {
  label: string
  value: string
  html: string
}

export interface DocsMdxContentProps {
  components?: Record<string, unknown>
}

export interface RenderExampleMarkdownPageInput {
  onThisPageEntries?: OnThisPageEntry[]
  Content: Component<DocsMdxContentProps>
  codeTabs: Record<string, DocsMdxCodeTabItem[]>
}

export function Markdown(input: RenderExampleMarkdownPageInput) {
  const components = createDocsMdxComponents(input)

  return (
    <main class="text-foreground px-5 min-h-screen w-full sm:px-8">
      <div class="mx-auto flex gap-8 max-w-7xl items-start">
        <div class="mx-auto mb-24 max-w-4xl min-w-0 w-full">
          <Dynamic component={input.Content} components={components} />
        </div>
        <OnThisPage entries={input.onThisPageEntries ?? []} />
      </div>
    </main>
  )
}

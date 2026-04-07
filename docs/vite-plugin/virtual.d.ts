declare module 'virtual:api-doc' {
  interface ComponentIndexEntry {
    key: string
    name: string
    category: string
    description?: string
    sourcePath?: string
    polymorphic: boolean
  }

  interface IndexDoc {
    components: ComponentIndexEntry[]
  }

  const data: IndexDoc
  export default data
}

declare module 'virtual:example-pages' {
  import type { Component } from 'solid-js'

  export type ExamplePageStatus = 'new' | 'update' | 'unreleased'

  export interface ExamplePageEntry {
    key: string
    group?: string
    label: string
    status?: ExamplePageStatus
  }

  export const exampleMap: Record<string, Component>
  export const pages: ExamplePageEntry[]
}

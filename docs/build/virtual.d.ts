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

declare module 'virtual:docs-expressive-code.css'
declare module 'virtual:docs-expressive-code-client'

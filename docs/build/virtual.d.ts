declare module 'virtual:api-doc' {
  interface ComponentIndexEntry {
    key: string
    name: string
    category: string
  }

  interface IndexDoc {
    components: Array<ComponentIndexEntry>
  }

  const data: IndexDoc
  export default data
}

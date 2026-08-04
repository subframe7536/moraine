export interface ComponentIndexEntry {
  key: string
  name: string
  category: string
  description?: string
  sourcePath?: string
  polymorphic: boolean
}

export interface IndexDoc {
  components: ComponentIndexEntry[]
}

export interface PropDoc {
  name: string
  required: boolean
  type: string
  defaultValue?: string
  description?: string
}

export interface InheritedGroupDoc {
  from: string
  props: PropDoc[]
}

export interface ItemDoc {
  props: PropDoc[]
  description?: string
}

export interface SlotDoc {
  name: string
  description?: string
  cssVariables: ApiAttributeDoc[]
  dataAttributes: ApiAttributeDoc[]
  ariaAttributes: ApiAttributeDoc[]
}

export interface ApiAttributeDoc {
  name: string
  required: false
  type: string
  description: string
}

export interface SlotDefinitionDoc {
  name: string
  description?: string
  runtimeSlots: string[]
}

export interface ComponentDoc {
  component: ComponentIndexEntry
  slots: SlotDoc[]
  props: {
    own: PropDoc[]
    inherited: InheritedGroupDoc[]
  }
  item?: ItemDoc
}

export interface GenerationResult {
  indexDoc: IndexDoc
  componentDocs: Map<string, ComponentDoc>
}

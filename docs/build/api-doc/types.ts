export type DefaultValue =
  | {
      kind: 'literal'
      value: string | number | boolean | null
    }
  | {
      kind: 'expression'
      text: string
    }

export interface GenericParameterApi {
  name: string
  constraint?: string
  default?: string
}

export type AccessApi =
  | { kind: 'export'; name: string }
  | { kind: 'attached'; root: string; member: string }
  | { kind: 'factory-member'; factory: string; member: string }

export interface PropApi {
  name: string
  optional: boolean
  type: string
  description?: string
  default?: DefaultValue
}

export interface PartApi {
  id: string
  name: string
  access: AccessApi
  description?: string
  generics?: GenericParameterApi[]
  defaultElement?: string
  props: PropApi[]
}

export interface ItemApi {
  description?: string
  generics?: GenericParameterApi[]
  props: PropApi[]
}

export interface DataAttributeTargetApi {
  target: string
  attributes: string[]
}

export interface ComponentApi {
  key: string
  name: string
  description?: string
  kind: 'single' | 'composite'
  parts: PartApi[]
  item?: ItemApi
  slots: string[]
  dataAttributes: DataAttributeTargetApi[]
}

export interface ComponentIndexEntry {
  key: string
  name: string
  category: string
}

export interface IndexDoc {
  components: ComponentIndexEntry[]
}

export interface GenerationResult {
  indexDoc: IndexDoc
  componentDocs: Map<string, ComponentApi>
}

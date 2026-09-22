export type DefaultValue =
  | {
      kind: 'literal'
      value: string | number | boolean | null
    }
  | {
      kind: 'expression'
      text: string
    }

export interface TypeApi {
  text: string
  refs?: string[]
  resolution?: 'partial'
}

export interface GenericParameterApi {
  name: string
  constraint?: string
  default?: string
}

export interface RenderingApi {
  rendersDom: boolean
  defaultElement?: string
  asProp?: string
  polymorphic?: boolean | GenericParameterApi
}

export type AccessApi =
  | { kind: 'export'; name: string; package: 'moraine' }
  | { kind: 'attached'; root: string; member: string }
  | { kind: 'factory-member'; factory: string; member: string }

export interface PropApi {
  name: string
  optional: boolean
  type: TypeApi
  description?: string
  default?: DefaultValue
}

export interface PartApi {
  id: string
  name: string
  access: AccessApi
  description?: string
  generics?: GenericParameterApi[]
  rendering?: RenderingApi
  props: PropApi[]
}

export interface ItemPropertyApi {
  name: string
  optional: boolean
  type: TypeApi
  description?: string
  default?: DefaultValue
}

export interface ItemApi {
  name?: string
  description?: string
  generics?: GenericParameterApi[]
  props: ItemPropertyApi[]
}

export interface DataAttributeTargetApi {
  target: string
  attributes: string[]
}

export interface CssVariableTargetApi {
  target: string
  variables: string[]
}

export interface ComponentApi {
  key: string
  name: string
  category: string
  description?: string
  kind: 'single' | 'composite'
  parts: PartApi[]
  item?: ItemApi
  slots: string[]
  dataAttributes: DataAttributeTargetApi[]
  cssVariables: CssVariableTargetApi[]
}

export interface ComponentIndexEntry {
  key: string
  name: string
  category: string
  description?: string
  kind: 'single' | 'composite'
}

export interface IndexDoc {
  components: ComponentIndexEntry[]
}

export interface GenerationResult {
  indexDoc: IndexDoc
  componentDocs: Map<string, ComponentApi>
  diagnostics: string[]
}

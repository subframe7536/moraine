export type PropGroup = 'state' | 'data' | 'behavior' | 'form' | 'rendering' | 'styling'

export type PropTrait = 'callback' | 'render-prop' | 'positioning'

export interface StateRelation {
  key: string
  role: 'value' | 'default' | 'change'
}

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

export type RuntimeAttributeValueApi =
  | { kind: 'presence' }
  | { kind: 'literal'; value: string }
  | { kind: 'enum'; values: string[] }
  | { kind: 'boolean' }
  | { kind: 'dynamic' }

export interface RuntimeAttributeApi {
  name: string
  kind: 'data' | 'aria' | 'role'
  value: RuntimeAttributeValueApi
  description?: string
}

export interface RuntimeTargetApi {
  name: string
  slot?: string
  selector?: string
  element?: string
  description?: string
  condition?: string
  attributes: RuntimeAttributeApi[]
}

export interface CssVariableApi {
  name: string
  target: string
  description?: string
  condition?: string
}

export interface SlotApi {
  name: string
  description?: string
}

export interface PropOrigin {
  declaredIn?: string
  module?: string
  inheritedVia?: string
}

export interface PropApi {
  name: string
  optional: boolean
  type: TypeApi
  description?: string
  default?: DefaultValue
  group: PropGroup
  traits?: PropTrait[]
  state?: StateRelation
  origin?: PropOrigin
}

export interface PartApi {
  id: string
  name: string
  access: AccessApi
  sourcePath: string
  description?: string
  generics?: GenericParameterApi[]
  rendering?: RenderingApi
  props: PropApi[]
  slots: SlotApi[]
  runtime: RuntimeTargetApi[]
  cssVariables: CssVariableApi[]
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

export interface ComponentApi {
  key: string
  name: string
  category: string
  description?: string
  kind: 'single' | 'composite'
  sourcePath: string
  parts: PartApi[]
  item?: ItemApi
}

export interface ComponentIndexEntry {
  key: string
  name: string
  category: string
  description?: string
  kind: 'single' | 'composite'
  sourcePath?: string
}

export interface IndexDoc {
  components: ComponentIndexEntry[]
}

export interface GenerationResult {
  indexDoc: IndexDoc
  componentDocs: Map<string, ComponentApi>
  diagnostics: string[]
}

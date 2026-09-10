import type { JSX } from 'solid-js'

export interface BaseSelectItems<TItems> {
  value?: string | number
  label?: string | JSX.Element
  key?: string
  disabled?: boolean
  children?: TItems[]
}

export type SelectFilterMode = 'startsWith' | 'endsWith' | 'contains'
export interface NormalizedOption<TItems> {
  id: string
  value: string | number
  label: string | JSX.Element
  key: string
  disabled: boolean
  raw: TItems
  renderItem: TItems
  isGroup?: false
}

export interface NormalizedGroup<TItems> {
  id: string
  label: string | JSX.Element
  options: NormalizedOption<TItems>[]
  isGroup: true
}

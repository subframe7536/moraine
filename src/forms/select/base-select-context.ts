import type { Accessor, JSX } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { createComponentStyles } from '../../shared/provider/create-component-styles'
import type { useTransitionPresence } from '../../shared/use-transition-presence'
import type { UseFormFieldReturn } from '../form/form-context'

import type { BaseSelectT } from './base-select.types'
import type { NormalizedGroup, NormalizedOption } from './shared'

export interface BaseSelectContext<TItem extends BaseSelectT.Item = BaseSelectT.Item> {
  isOpen: Accessor<boolean>
  setOpen: (open: boolean) => void
  close: () => void
  toggle: () => void
  highlightedKey: Accessor<string | undefined>
  setHighlightedKey: (key: string | undefined) => void
  inputValue: Accessor<string>
  setInputValue: (value: string) => void
  isSearchable: Accessor<boolean>
  field: UseFormFieldReturn
  selectedValues: Accessor<BaseSelectT.Value[]>
  selectedOptions: Accessor<NormalizedOption<TItem>[]>
  selectedOptionIds: Accessor<Set<string>>
  visibleOptions: Accessor<Array<NormalizedOption<TItem> | NormalizedGroup<TItem>>>
  visibleFlatOptions: Accessor<NormalizedOption<TItem>[]>
  allFlatOptions: Accessor<NormalizedOption<TItem>[]>
  listboxId: Accessor<string>
  getOptionId: (key: string) => string
  controlProps: Accessor<JSX.HTMLAttributes<HTMLDivElement>>
  inputProps: Accessor<JSX.InputHTMLAttributes<HTMLInputElement>>
  onInput: (event: InputEvent) => void
  onKeyDown: (event: KeyboardEvent) => void
  selectOption: (option: NormalizedOption<TItem>) => void
  clear: () => void
  focusInput: () => void
  resolved: ReturnType<typeof createComponentStyles<'select' | 'baseSelect'>>
  contentPresence: ReturnType<typeof useTransitionPresence>
  contentSide: Accessor<'top' | 'bottom'>
  setPositionerElement: (el: HTMLDivElement | undefined) => void
  setContentElement: (el: HTMLDivElement | undefined) => void
  setControlRef: (el: HTMLElement | undefined) => void
  hasControlRef: Accessor<boolean>
  registerControl: () => () => void
  setComboboxRef: (el: HTMLElement | undefined) => void
  setListboxRef: (el: HTMLDivElement | undefined) => void
  registerContent: () => () => void
  hasCustomContent: Accessor<boolean>
  registerItem: (item: Accessor<TItem>) => () => void
  getRegisteredOption: (item: Accessor<TItem>) => NormalizedOption<TItem> | undefined
  displayValue: () => JSX.Element
  renderDefaultListbox: (props?: BaseSelectT.ListboxProps<TItem>) => JSX.Element
  multiple: Accessor<boolean | undefined>
  handleListboxScroll: (event: Event) => void
  stateApi: BaseSelectT.StateApi<TItem>
  controlApi: BaseSelectT.ControlApi<TItem>
}

const [BaseSelectProviderInternal, useBaseSelectContextInternal] =
  createContextProvider<BaseSelectContext<any>>('BaseSelect')

export const BaseSelectProvider = BaseSelectProviderInternal

export function useBaseSelectContext<
  TItem extends BaseSelectT.Item = BaseSelectT.Item,
>(): BaseSelectContext<TItem> {
  return useBaseSelectContextInternal() as BaseSelectContext<TItem>
}

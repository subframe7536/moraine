import type { BaseSelect, createId, useCn, BaseSelectT, ComponentOrElement } from 'moraine'
import type {
  createBaseSelectSearchInput,
  createControllableValue,
  createDisclosureState,
  createEventListener,
  createEventListenerMap,
  createMediaQuery,
  createSelectableCollectionNavigation,
  createSlider,
  createTransitionPresence,
} from 'moraine/utils'
import type {
  createListVirtualizer,
  ListVirtualizerOptions,
  ListVirtualizerReturn,
  RowProps,
  VirtualRenderProps,
} from 'moraine/virtualizer'

type Assert<T extends true> = T
type Callable = (...args: never[]) => unknown
export type PublicUtilityEntries = [
  Assert<typeof createId extends Callable ? true : false>,
  Assert<typeof useCn extends Callable ? true : false>,
  Assert<typeof BaseSelect.useContext extends Callable ? true : false>,
  Assert<typeof createBaseSelectSearchInput extends Callable ? true : false>,
  Assert<typeof createControllableValue extends Callable ? true : false>,
  Assert<typeof createDisclosureState extends Callable ? true : false>,
  Assert<typeof createEventListener extends Callable ? true : false>,
  Assert<typeof createEventListenerMap extends Callable ? true : false>,
  Assert<typeof createMediaQuery extends Callable ? true : false>,
  Assert<typeof createSelectableCollectionNavigation extends Callable ? true : false>,
  Assert<typeof createSlider extends Callable ? true : false>,
  Assert<typeof createTransitionPresence extends Callable ? true : false>,
  Assert<typeof createListVirtualizer extends Callable ? true : false>,
  Assert<ComponentOrElement extends unknown ? true : false>,
  Assert<BaseSelectT.Context extends object ? true : false>,
  Assert<ListVirtualizerOptions<string> extends object ? true : false>,
  Assert<ListVirtualizerReturn<string> extends object ? true : false>,
  Assert<RowProps extends object ? true : false>,
  Assert<VirtualRenderProps<string> extends object ? true : false>,
]

// @ts-expect-error Old root ID primitive was removed.
export type OldId = typeof import('moraine').useId
// @ts-expect-error Old top-level select state was removed.
export type OldSelectState = typeof import('moraine').useSelectState
// @ts-expect-error Render helper is private; only its type remains public.
export type RenderHelper = typeof import('moraine').renderComponentOrElement
// @ts-expect-error Old controllable value utility was removed.
export type OldControllable = typeof import('moraine/utils').useControllableValue
// @ts-expect-error Old transition utility was removed.
export type OldPresence = typeof import('moraine/utils').useTransitionPresence
// @ts-expect-error Old slider utility was removed.
export type OldSlider = typeof import('moraine/utils').useSlider
// @ts-expect-error Old virtualizer adapter was removed.
export type OldVirtualizer = typeof import('moraine/virtualizer').useListVirtualizer
// @ts-expect-error Context provider factory is internal.
export type InternalProvider = typeof import('moraine/utils').createContextProvider
// @ts-expect-error Render helper is internal.
export type InternalRenderer = typeof import('moraine/utils').renderComponentOrElement
// @ts-expect-error Raw listener attachment requires manual cleanup and is internal.
export type InternalListener = typeof import('moraine/utils').attachEventListener
// @ts-expect-error Raw listener map attachment is internal.
export type InternalListenerMap = typeof import('moraine/utils').attachEventListenerMap
// @ts-expect-error Loading hook is internal.
export type InternalLoading = typeof import('moraine/utils').useLoadingAutoClick

import { Combobox, useComboboxContext } from '@kobalte/core/combobox'
import type {
  ComboboxRootItemComponentProps,
  ComboboxRootSectionComponentProps,
} from '@kobalte/core/combobox'
import type { ClassValue } from 'cls-variant'
import type { JSX } from 'solid-js'
import { For, Match, Show, Switch, createMemo } from 'solid-js'

import { Icon, IconButton } from '../../../elements/icon'
import type { IconT } from '../../../elements/icon'
import { overlayMenuContentVariants } from '../../../overlays/shared-overlay-menu/menu.class'
import { cn } from '../../../shared/utils'
import { selectItemVariants } from '../select.class'

import type { NormalizedGroup, NormalizedOption, SelectControlState } from './types'

interface SelectClearButtonRenderProps {
  show: boolean
  size?: string
  iconName?: IconT.Name
  style?: JSX.CSSProperties
  rootClass?: ClassValue
  onClick: (event: MouseEvent) => void
}

interface SelectTriggerButtonRenderProps {
  style?: JSX.CSSProperties
  name?: IconT.Name
  size?: string
  rootClass?: ClassValue
  loading?: boolean
  loadingIcon?: IconT.Name
  onClick: (event: MouseEvent) => void
}

interface SelectEmptyRenderProps<TContext> {
  emptyRender?: string | ((context: TContext) => JSX.Element)
  context: () => TContext
  style?: JSX.CSSProperties
  class?: ClassValue
}

interface SelectComboboxFrameProps<TItems> {
  controlStyle?: JSX.CSSProperties
  controlClass?: ClassValue
  invalid: boolean
  highlight: boolean
  disabled: boolean
  renderTriggerContent: (state: SelectControlState<TItems>) => JSX.Element
  hasMatches: () => boolean
  emptyNode: JSX.Element
  virtualized: boolean
  contentStyle?: JSX.CSSProperties
  contentClass?: ClassValue
  listboxStyle?: JSX.CSSProperties
  listboxClass?: ClassValue
  onContentInteractOutside?: (event: Event) => void
  onContentCloseAutoFocus?: (event: Event) => void
  onListboxScrollEnd?: (event: Event) => void
  sectionComponent: (
    props: ComboboxRootSectionComponentProps<NormalizedGroup<TItems>>,
  ) => JSX.Element
  itemComponent: (props: ComboboxRootItemComponentProps<NormalizedOption<TItems>>) => JSX.Element
}

interface SelectComponentStyles {
  item?: JSX.CSSProperties
  itemLabel?: JSX.CSSProperties
  itemDescription?: JSX.CSSProperties
  itemTrailing?: JSX.CSSProperties
  group?: JSX.CSSProperties
  label?: JSX.CSSProperties
}

interface SelectComponentClasses {
  item?: ClassValue
  itemLabel?: ClassValue
  itemDescription?: ClassValue
  itemTrailing?: ClassValue
  group?: ClassValue
  label?: ClassValue
}

interface CreateSelectComponentsProps<
  TItems extends { icon?: IconT.Name; description?: string | JSX.Element },
  TState,
> {
  styles?: () => SelectComponentStyles | undefined
  size: () => string
  classes?: () => SelectComponentClasses | undefined
  optionRender?: () => ((option: TItems & TState) => JSX.Element) | undefined
  labelRender?: () => ((option: TItems) => JSX.Element) | undefined
}

interface BaseOptionRenderState {
  isSelected: boolean
  isHighlighted: boolean
  isDisabled: boolean
}

export function createSelectComponents<
  TItems extends { icon?: IconT.Name; description?: string | JSX.Element },
  TState = BaseOptionRenderState,
>(props: CreateSelectComponentsProps<TItems, TState>) {
  const ItemComponent = (
    itemProps: ComboboxRootItemComponentProps<NormalizedOption<TItems>>,
  ): JSX.Element => {
    const context = useComboboxContext()
    const raw = (): TItems => itemProps.item.rawValue.raw
    const renderState = createMemo<TState>(() => {
      const selectionManager = context.listState().selectionManager()
      const state: BaseOptionRenderState = {
        isSelected: selectionManager.isSelected(itemProps.item.key),
        isHighlighted: selectionManager.focusedKey() === itemProps.item.key,
        isDisabled: itemProps.item.rawValue.disabled,
      }

      return state as TState
    })

    const optionRender = createMemo(() => props.optionRender?.())
    const labelRender = createMemo(() => props.labelRender?.())
    const optionIcon = createMemo(() => raw().icon)
    const optionDescription = createMemo(() => raw().description)

    const renderLabel = (): JSX.Element => (
      <Combobox.ItemLabel
        data-slot="itemLabel"
        style={props.styles?.()?.itemLabel}
        class={cn('col-start-1 truncate', props.classes?.()?.itemLabel)}
      >
        <Show when={labelRender()} keyed fallback={itemProps.item.rawValue.label}>
          {(render) => render(raw())}
        </Show>
      </Combobox.ItemLabel>
    )

    return (
      <Combobox.Item
        item={itemProps.item}
        data-slot="item"
        style={props.styles?.()?.item}
        onPointerDown={(event) => event.preventDefault()}
        class={selectItemVariants(
          {
            size: props.size() as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined,
          },
          props.classes?.()?.item,
        )}
      >
        <Show
          when={optionRender()}
          keyed
          fallback={
            <>
              <Show when={optionIcon()} fallback={renderLabel()}>
                {(icon) => (
                  <span class="flex gap-2 col-start-1 items-center">
                    <Icon name={icon()} />
                    {renderLabel()}
                  </span>
                )}
              </Show>

              <Show when={optionDescription()}>
                {(desc) => (
                  <Combobox.ItemDescription
                    data-slot="itemDescription"
                    style={props.styles?.()?.itemDescription}
                    class={cn(
                      'text-xs text-muted-foreground col-start-1',
                      props.classes?.()?.itemDescription,
                    )}
                  >
                    {desc()}
                  </Combobox.ItemDescription>
                )}
              </Show>

              <Combobox.ItemIndicator
                data-slot="itemTrailing"
                style={props.styles?.()?.itemTrailing}
                class={cn(
                  'text-sm inline-flex col-start-2 items-center justify-center',
                  props.classes?.()?.itemTrailing,
                )}
              >
                <Icon name="icon-check" />
              </Combobox.ItemIndicator>
            </>
          }
        >
          {(render) => render({ ...raw(), ...renderState() } as TItems & TState)}
        </Show>
      </Combobox.Item>
    )
  }

  const SectionComponent = (
    sectionProps: ComboboxRootSectionComponentProps<NormalizedGroup<TItems>>,
  ): JSX.Element => (
    <Combobox.Section
      data-slot="group"
      style={props.styles?.()?.group}
      class={cn('[&:not(:first-child)]:mt-1.5', props.classes?.()?.group)}
    >
      <span
        data-slot="label"
        style={props.styles?.()?.label}
        class={cn(
          'text-xs text-muted-foreground font-medium px-2 py-1.5 block',
          props.classes?.()?.label,
        )}
      >
        {sectionProps.section.rawValue.label}
      </span>
    </Combobox.Section>
  )

  return {
    ItemComponent,
    SectionComponent,
  }
}

export function RenderSelectClearButton(props: SelectClearButtonRenderProps): JSX.Element {
  return (
    <Show when={props.show}>
      <IconButton
        name={props.iconName ?? 'icon-close'}
        size={props.size as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined}
        data-slot="clear"
        styles={{ root: props.style }}
        classes={{ root: props.rootClass }}
        tabIndex={-1}
        onClick={props.onClick}
      />
    </Show>
  )
}

export function RenderSelectTriggerButton(props: SelectTriggerButtonRenderProps): JSX.Element {
  return (
    <Combobox.Trigger
      as={(triggerProps: Record<string, unknown>) => (
        <IconButton
          {...triggerProps}
          data-slot="trigger"
          styles={{ root: props.style }}
          name={props.name}
          size={props.size as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined}
          classes={{
            root: props.rootClass,
            icon: 'data-loading:animate-loading',
          }}
          loading={props.loading}
          loadingIcon={props.loadingIcon}
          tabIndex={-1}
        />
      )}
      onClick={props.onClick}
    />
  )
}

export function RenderSelectEmptyNode<TContext>(
  props: SelectEmptyRenderProps<TContext>,
): JSX.Element {
  return (
    <Show
      when={typeof props.emptyRender === 'function' ? props.emptyRender : undefined}
      fallback={
        <div
          data-slot="empty"
          style={props.style}
          class={cn('text-sm text-muted-foreground p-2 text-center', props.class)}
        >
          {typeof props.emptyRender === 'string' ? props.emptyRender : 'No options'}
        </div>
      }
    >
      {(renderEmpty) => renderEmpty()(props.context())}
    </Show>
  )
}

export function RenderSelectComboboxFrame<TItems>(
  props: SelectComboboxFrameProps<TItems>,
): JSX.Element {
  return (
    <>
      <Combobox.Control<NormalizedOption<TItems>>
        data-slot="base"
        style={props.controlStyle}
        data-invalid={props.invalid ? '' : undefined}
        data-highlight={props.highlight ? '' : undefined}
        data-disabled={props.disabled ? '' : undefined}
        class={cn(props.controlClass)}
      >
        {(state) => props.renderTriggerContent(state)}
      </Combobox.Control>

      <Combobox.Portal>
        <Combobox.Content
          data-slot="content"
          style={props.contentStyle}
          class={overlayMenuContentVariants({}, props.contentClass)}
          onInteractOutside={props.onContentInteractOutside}
          onCloseAutoFocus={props.onContentCloseAutoFocus}
        >
          <Show when={props.hasMatches()} fallback={props.emptyNode}>
            <Combobox.Listbox
              data-slot="listbox"
              style={props.listboxStyle}
              class={cn(
                'outline-none max-h-$kb-popper-content-available-height overflow-y-auto',
                props.virtualized && 'p-1',
                props.listboxClass,
              )}
              onScrollEnd={props.onListboxScrollEnd}
            >
              {(items) => (
                <Show when={props.virtualized}>
                  <For each={Array.from(items())}>
                    {(node) => (
                      <Switch>
                        <Match when={node.type === 'section'}>
                          {props.sectionComponent({
                            section: node as ComboboxRootSectionComponentProps<
                              NormalizedGroup<TItems>
                            >['section'],
                          })}
                        </Match>
                        <Match when={node.type === 'item'}>
                          {props.itemComponent({
                            item: node as ComboboxRootItemComponentProps<
                              NormalizedOption<TItems>
                            >['item'],
                          })}
                        </Match>
                      </Switch>
                    )}
                  </For>
                </Show>
              )}
            </Combobox.Listbox>
          </Show>
        </Combobox.Content>
      </Combobox.Portal>
      <Combobox.HiddenSelect />
    </>
  )
}

import type { JSX } from 'solid-js'
import { createContext, createMemo, useContext } from 'solid-js'

import type { SlotFn, SlotFns } from '../style/recipe.ts'
import type { SlotClassValue, SlotStyleValue } from '../types.ts'
import { cn } from '../utils.ts'

import type { AccordionT } from '../../elements/accordion/index.ts'
import type { AvatarGroupT, AvatarT } from '../../elements/avatar/index.ts'
import type { BadgeT } from '../../elements/badge/index.ts'
import type { ButtonGroupT, ButtonT } from '../../elements/button/index.ts'
import type { CardT } from '../../elements/card/index.ts'
import type { CollapsibleT } from '../../elements/collapsible/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import type { KbdGroupT, KbdT } from '../../elements/kbd/index.ts'
import type { ListT } from '../../elements/list/index.ts'
import type { ProgressT } from '../../elements/progress/index.ts'
import type { ResizableT } from '../../elements/resizable/index.ts'
import type { SeparatorT } from '../../elements/separator/index.ts'
import type { CheckboxGroupT } from '../../forms/checkbox-group/index.ts'
import type { CheckboxT } from '../../forms/checkbox/index.ts'
import type { FileUploadT } from '../../forms/file-upload/index.ts'
import type { FormFieldT, FormT } from '../../forms/form/index.ts'
import type { InputNumberT } from '../../forms/input-number/index.ts'
import type { InputT } from '../../forms/input/index.ts'
import type { RadioGroupT } from '../../forms/radio-group/index.ts'
import type { MultiSelectT, SelectT } from '../../forms/select/index.ts'
import type { SliderT } from '../../forms/slider/index.ts'
import type { SwitchT } from '../../forms/switch/index.ts'
import type { TextareaT } from '../../forms/textarea/index.ts'
import type { BreadcrumbT } from '../../navigation/breadcrumb/index.ts'
import type { CommandPaletteT } from '../../navigation/command-palette/index.ts'
import type { PaginationT } from '../../navigation/pagination/index.ts'
import type { SidebarFrameT } from '../../navigation/sidebar-frame/index.ts'
import type { StepperT } from '../../navigation/stepper/index.ts'
import type { TabsT } from '../../navigation/tabs/index.ts'
import type { ContextMenuT } from '../../overlays/context-menu/index.ts'
import type { DialogT } from '../../overlays/dialog/index.ts'
import type { DropdownMenuT } from '../../overlays/dropdown-menu/index.ts'
import type { ModalT } from '../../overlays/modal/index.ts'
import type { PopoverT } from '../../overlays/popover/index.ts'
import type { SheetT } from '../../overlays/sheet/index.ts'
import type { TooltipT } from '../../overlays/tooltip/index.ts'

export interface ComponentDefaultStyle<
  V = Record<string, unknown>,
  C = Record<string, SlotClassValue>,
  S = Record<string, SlotStyleValue>,
> {
  defaultProps?: [V] extends [never] ? never : Partial<V>
  class?: SlotClassValue
  classes?: [C] extends [never] ? never : Partial<C>
  style?: JSX.CSSProperties
  styles?: [S] extends [never] ? never : Partial<S>
}

export interface MoraineConfig {
  accordion?: ComponentDefaultStyle<AccordionT.Variant, AccordionT.Classes, AccordionT.Styles>
  avatar?: ComponentDefaultStyle<AvatarT.Variant, AvatarT.Classes, AvatarT.Styles>
  avatarGroup?: ComponentDefaultStyle<
    AvatarGroupT.Variant,
    AvatarGroupT.Classes,
    AvatarGroupT.Styles
  >
  badge?: ComponentDefaultStyle<BadgeT.Variant, BadgeT.Classes, BadgeT.Styles>
  breadcrumb?: ComponentDefaultStyle<BreadcrumbT.Variant, BreadcrumbT.Classes, BreadcrumbT.Styles>
  button?: ComponentDefaultStyle<ButtonT.Variant, ButtonT.Classes, ButtonT.Styles>
  buttonGroup?: ComponentDefaultStyle<
    ButtonGroupT.Variant,
    ButtonGroupT.Classes,
    ButtonGroupT.Styles
  >
  card?: ComponentDefaultStyle<CardT.Variant, CardT.Classes, CardT.Styles>
  checkbox?: ComponentDefaultStyle<CheckboxT.Variant, CheckboxT.Classes, CheckboxT.Styles>
  checkboxGroup?: ComponentDefaultStyle<
    CheckboxGroupT.Variant,
    CheckboxGroupT.Classes,
    CheckboxGroupT.Styles
  >
  collapsible?: ComponentDefaultStyle<
    CollapsibleT.Variant,
    CollapsibleT.Classes,
    CollapsibleT.Styles
  >
  commandPalette?: ComponentDefaultStyle<
    CommandPaletteT.Variant,
    CommandPaletteT.Classes,
    CommandPaletteT.Styles
  >
  contextMenu?: ComponentDefaultStyle<
    ContextMenuT.Variant,
    ContextMenuT.Classes,
    ContextMenuT.Styles
  >
  dialog?: ComponentDefaultStyle<DialogT.Variant, DialogT.Classes, DialogT.Styles>
  dropdownMenu?: ComponentDefaultStyle<
    DropdownMenuT.Variant,
    DropdownMenuT.Classes,
    DropdownMenuT.Styles
  >
  fileUpload?: ComponentDefaultStyle<FileUploadT.Variant, FileUploadT.Classes, FileUploadT.Styles>
  form?: ComponentDefaultStyle<FormT.Variant, FormT.Classes, FormT.Styles>
  formField?: ComponentDefaultStyle<FormFieldT.Variant, FormFieldT.Classes, FormFieldT.Styles>
  icon?: ComponentDefaultStyle<IconT.Variant, IconT.Classes, IconT.Styles>
  input?: ComponentDefaultStyle<InputT.Variant, InputT.Classes, InputT.Styles>
  inputNumber?: ComponentDefaultStyle<
    InputNumberT.Variant,
    InputNumberT.Classes,
    InputNumberT.Styles
  >
  kbd?: ComponentDefaultStyle<KbdT.Variant, KbdT.Classes, KbdT.Styles>
  kbdGroup?: ComponentDefaultStyle<KbdGroupT.Variant, KbdGroupT.Classes, KbdGroupT.Styles>
  list?: ComponentDefaultStyle<ListT.Variant, ListT.Classes, ListT.Styles>
  modal?: ComponentDefaultStyle<ModalT.Variant, ModalT.Classes, ModalT.Styles>
  multiSelect?: ComponentDefaultStyle<
    MultiSelectT.Variant,
    MultiSelectT.Classes,
    MultiSelectT.Styles
  >
  pagination?: ComponentDefaultStyle<PaginationT.Variant, PaginationT.Classes, PaginationT.Styles>
  popover?: ComponentDefaultStyle<PopoverT.Variant, PopoverT.Classes, PopoverT.Styles>
  progress?: ComponentDefaultStyle<ProgressT.Variant, ProgressT.Classes, ProgressT.Styles>
  radioGroup?: ComponentDefaultStyle<RadioGroupT.Variant, RadioGroupT.Classes, RadioGroupT.Styles>
  resizable?: ComponentDefaultStyle<ResizableT.Variant, ResizableT.Classes, ResizableT.Styles>
  select?: ComponentDefaultStyle<SelectT.Variant, SelectT.Classes, SelectT.Styles>
  separator?: ComponentDefaultStyle<SeparatorT.Variant, SeparatorT.Classes, SeparatorT.Styles>
  sheet?: ComponentDefaultStyle<SheetT.Variant, SheetT.Classes, SheetT.Styles>
  sidebarFrame?: ComponentDefaultStyle<
    SidebarFrameT.Variant,
    SidebarFrameT.Classes,
    SidebarFrameT.Styles
  >
  slider?: ComponentDefaultStyle<SliderT.Variant, SliderT.Classes, SliderT.Styles>
  stepper?: ComponentDefaultStyle<StepperT.Variant, StepperT.Classes, StepperT.Styles>
  switch?: ComponentDefaultStyle<SwitchT.Variant, SwitchT.Classes, SwitchT.Styles>
  tabs?: ComponentDefaultStyle<TabsT.Variant, TabsT.Classes, TabsT.Styles>
  textarea?: ComponentDefaultStyle<TextareaT.Variant, TextareaT.Classes, TextareaT.Styles>
  tooltip?: ComponentDefaultStyle<TooltipT.Variant, TooltipT.Classes, TooltipT.Styles>
}

export function mergeComponentStyle<
  V extends Record<string, unknown> = Record<string, unknown>,
  C extends object = Record<string, SlotClassValue>,
  S extends object = Record<string, SlotStyleValue>,
>(
  parent?: ComponentDefaultStyle<V, C, S>,
  child?: ComponentDefaultStyle<V, C, S>,
): ComponentDefaultStyle<V, C, S> | undefined {
  if (!parent) return child
  if (!child) return parent

  const mergedClasses: Record<string, SlotClassValue> = { ...parent.classes }
  if (child.classes) {
    for (const [slot, cls] of Object.entries(child.classes)) {
      mergedClasses[slot] = cn(mergedClasses[slot], cls as SlotClassValue)
    }
  }

  const mergedStyles: Record<string, SlotStyleValue | undefined> = { ...parent.styles }
  if (child.styles) {
    for (const [slot, sty] of Object.entries(child.styles)) {
      const parentSlot = mergedStyles[slot]
      if (sty && typeof sty === 'object' && parentSlot && typeof parentSlot === 'object') {
        mergedStyles[slot] = { ...parentSlot, ...sty } as JSX.CSSProperties
      } else if (sty && typeof sty === 'object') {
        mergedStyles[slot] = sty as JSX.CSSProperties
      } else if (parentSlot && typeof parentSlot === 'object') {
        mergedStyles[slot] = parentSlot as JSX.CSSProperties
      }
    }
  }

  const mergedDefaultProps =
    parent.defaultProps || child.defaultProps
      ? { ...parent.defaultProps, ...child.defaultProps }
      : undefined

  const mergedClass = cn(parent.class, child.class)

  const mergedStyle =
    parent.style || child.style
      ? ({
          ...(parent.style && typeof parent.style === 'object' ? parent.style : undefined),
          ...(child.style && typeof child.style === 'object' ? child.style : undefined),
        } as JSX.CSSProperties)
      : undefined

  return {
    ...(mergedDefaultProps ? { defaultProps: mergedDefaultProps as any } : {}),
    ...(mergedClass ? { class: mergedClass } : {}),
    ...(Object.keys(mergedClasses).length > 0 ? { classes: mergedClasses as any } : {}),
    ...(mergedStyle ? { style: mergedStyle } : {}),
    ...(Object.keys(mergedStyles).length > 0 ? { styles: mergedStyles as any } : {}),
  } as ComponentDefaultStyle<V, C, S>
}

export function mergeMoraineConfig(
  parent?: MoraineConfig,
  child?: MoraineConfig,
): MoraineConfig {
  if (!parent) return child ?? {}
  if (!child) return parent

  const result: MoraineConfig = { ...parent }
  for (const [key, childStyle] of Object.entries(child)) {
    const parentStyle = (parent as Record<string, any>)[key]
    ;(result as Record<string, any>)[key] = mergeComponentStyle(parentStyle, childStyle)
  }
  return result
}

export interface ComponentStyleInputs<S extends string, V extends Record<string, unknown>> {
  /** Recipe slot functions for this instance. */
  slots: SlotFns<S>
  /** Provider overrides (already deep-merged outer → inner). */
  provider?: ComponentDefaultStyle<
    V,
    Record<string, SlotClassValue>,
    Record<string, SlotStyleValue>
  >
  /** Composition context (e.g. ButtonGroup). Sits between provider and instance. */
  group?: Partial<
    ComponentDefaultStyle<
      V,
      Record<string, SlotClassValue>,
      Record<string, SlotStyleValue>
    >
  >
  /** Instance props (class/classes/style/styles only). */
  instance?: Partial<
    ComponentDefaultStyle<
      V,
      Record<string, SlotClassValue>,
      Record<string, SlotStyleValue>
    >
  >
  /** Per-slot state classes (e.g. `{ leading: LOADING_SPINNER }`). */
  stateCls?: Partial<Record<S | 'root', SlotClassValue>>
  /** Component-generated CSS variables (e.g. `defineStyleVars` output). */
  baseStyle?: JSX.CSSProperties
}

export interface ResolvedComponentStyle<S extends string> {
  rootClass: () => string | undefined
  rootStyle: () => JSX.CSSProperties
  slotClass: (slot: S) => string | undefined
  slotStyle: (slot: S) => JSX.CSSProperties | undefined
}

/**
 * The single normative chain resolver.
 *
 * Ordering (weakest → strongest) matches the Inheritance and Override
 * Precedence table exactly:
 *   class: recipe slots → provider.class → provider.classes[slot]
 *          → group.class → group.classes[slot] → stateCls[slot]
 *          → instance.classes[slot] → instance.class (root only)
 *   style: baseStyle → provider.style → provider.styles[slot]
 *          → group.style → group.styles[slot] → instance.styles[slot]
 *          → instance.style (root only)
 */
export function resolveComponentStyle<S extends string, V extends Record<string, unknown>>(
  inputs: ComponentStyleInputs<S, V>,
): ResolvedComponentStyle<S> {
  return {
    rootClass: () =>
      (inputs.slots as unknown as Record<string, SlotFn>).root?.(
        inputs.provider?.class,
        inputs.provider?.classes?.root,
        inputs.group?.class,
        inputs.group?.classes?.root,
        inputs.stateCls?.root,
        inputs.instance?.classes?.root,
        inputs.instance?.class,
      ) ??
      cn(
        inputs.provider?.class,
        inputs.provider?.classes?.root,
        inputs.group?.class,
        inputs.group?.classes?.root,
        inputs.stateCls?.root,
        inputs.instance?.classes?.root,
        inputs.instance?.class,
      ),
    rootStyle: () => ({
      ...inputs.baseStyle,
      ...inputs.provider?.style,
      ...inputs.provider?.styles?.root,
      ...inputs.group?.style,
      ...inputs.group?.styles?.root,
      ...inputs.instance?.styles?.root,
      ...inputs.instance?.style,
    }),
    slotClass: (slot) =>
      inputs.slots[slot](
        inputs.provider?.classes?.[slot],
        inputs.group?.classes?.[slot],
        inputs.stateCls?.[slot],
        inputs.instance?.classes?.[slot],
      ),
    slotStyle: (slot) => ({
      ...inputs.provider?.styles?.[slot],
      ...inputs.group?.styles?.[slot],
      ...inputs.instance?.styles?.[slot],
    }),
  }
}

export interface MoraineProviderProps {
  config?: MoraineConfig
  children?: JSX.Element
}

export type MoraineConfigAccessor = () => MoraineConfig

export const MoraineConfigContext = createContext<MoraineConfigAccessor>(() => ({}))

export function MoraineProvider(props: MoraineProviderProps): JSX.Element {
  const parent = useContext(MoraineConfigContext)
  const config = createMemo(() => mergeMoraineConfig(parent(), props.config))
  return (
    <MoraineConfigContext.Provider value={config}>{props.children}</MoraineConfigContext.Provider>
  )
}

export function useMoraineConfig(): MoraineConfigAccessor {
  return useContext(MoraineConfigContext)
}

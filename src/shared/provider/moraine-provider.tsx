import type { JSX } from 'solid-js'
import { createContext, createMemo, useContext } from 'solid-js'

import type { AccordionT } from '../../elements/accordion/index.ts'
import type { AvatarGroupT, AvatarT } from '../../elements/avatar/index.ts'
import type { BadgeT } from '../../elements/badge/index.ts'
import type { ButtonGroupT, ButtonT } from '../../elements/button/index.ts'
import type { CardT } from '../../elements/card/index.ts'
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
import type { PopoverT } from '../../overlays/popover/index.ts'
import type { SheetT } from '../../overlays/sheet/index.ts'
import type { TooltipT } from '../../overlays/tooltip/index.ts'
import type { SlotClassValue, SlotStyleValue } from '../types.ts'
import { cn } from '../utils.ts'

export interface ComponentDefaultStyle<
  V = Record<string, unknown>,
  C = Record<string, SlotClassValue>,
  S = Record<string, SlotStyleValue>,
> {
  variants?: [V] extends [never] ? never : Partial<V>
  classes?: [C] extends [never] ? never : Partial<C>
  styles?: [S] extends [never] ? never : Partial<{ [K in keyof S]: JSX.CSSProperties }>
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
  if (!parent) {
    return child
  }
  if (!child) {
    return parent
  }

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
        mergedStyles[slot] = { ...parentSlot, ...sty }
      } else if (sty && typeof sty === 'object') {
        mergedStyles[slot] = sty as JSX.CSSProperties
      } else if (parentSlot && typeof parentSlot === 'object') {
        mergedStyles[slot] = parentSlot
      }
    }
  }

  const mergedVariants =
    parent.variants || child.variants ? { ...parent.variants, ...child.variants } : undefined

  return {
    ...(mergedVariants ? { variants: mergedVariants as any } : {}),
    ...(Object.keys(mergedClasses).length > 0 ? { classes: mergedClasses as any } : {}),
    ...(Object.keys(mergedStyles).length > 0 ? { styles: mergedStyles as any } : {}),
  }
}

export function mergeMoraineConfig(parent?: MoraineConfig, child?: MoraineConfig): MoraineConfig {
  if (!parent) {
    return child ?? {}
  }
  if (!child) {
    return parent
  }

  const result: MoraineConfig = { ...parent }
  for (const [key, childStyle] of Object.entries(child)) {
    const parentStyle = (parent as Record<string, any>)[key]
    ;(result as Record<string, any>)[key] = mergeComponentStyle(parentStyle, childStyle)
  }
  return result
}

/** A single level in the component's class and inline-style cascade. */
export interface ComponentStyleLayer<S extends string> {
  classes?: Partial<Record<S, SlotClassValue>>
  styles?: Partial<Record<S, JSX.CSSProperties>>
}

export interface ComponentStyleInputs<S extends string> {
  base?: ComponentStyleLayer<S>
  provider?: ComponentStyleLayer<S>
  group?: ComponentStyleLayer<S>
  state?: ComponentStyleLayer<S>
  instance?: ComponentStyleLayer<S> & {
    class?: SlotClassValue
    style?: JSX.CSSProperties
  }
  /** Slot receiving the root class/style props. Defaults to root. */
  rootSlot?: NoInfer<S>
}

export interface SlotOverride {
  group?: { class?: SlotClassValue; style?: JSX.CSSProperties }
  state?: { class?: SlotClassValue; style?: JSX.CSSProperties }
}

export interface SlotBinding {
  readonly class: string | undefined
  readonly style: JSX.CSSProperties
}

export interface ResolvedComponentStyle<S extends string> {
  rootClass: (override?: SlotOverride) => string | undefined
  rootStyle: (override?: SlotOverride) => JSX.CSSProperties
  rootClassAndStyle: (override?: SlotOverride) => SlotBinding
  slotClass: (slot: S, override?: SlotOverride) => string | undefined
  slotStyle: (slot: S, override?: SlotOverride) => JSX.CSSProperties
  slotClassAndStyle: (slot: S, override?: SlotOverride) => SlotBinding
}

/**
 * Resolves both channels in order: base → provider → group → state → instance.
 * Root props follow instance slot overrides. Per-call overrides belong to their
 * named level. Inputs and bindings retain getters so JSX owns reactive tracking.
 */
export function resolveComponentStyle<S extends string>(
  inputs: ComponentStyleInputs<S>,
): ResolvedComponentStyle<S> {
  function resolveSlot(slot: S, override?: SlotOverride): SlotBinding {
    return {
      get class() {
        return cn(
          inputs.base?.classes?.[slot],
          inputs.provider?.classes?.[slot],
          inputs.group?.classes?.[slot],
          override?.group?.class,
          inputs.state?.classes?.[slot],
          override?.state?.class,
          inputs.instance?.classes?.[slot],
          slot === (inputs.rootSlot ?? 'root') && inputs.instance?.class,
        )
      },
      get style() {
        return {
          ...inputs.base?.styles?.[slot],
          ...inputs.provider?.styles?.[slot],
          ...inputs.group?.styles?.[slot],
          ...override?.group?.style,
          ...inputs.state?.styles?.[slot],
          ...override?.state?.style,
          ...inputs.instance?.styles?.[slot],
          ...(slot === (inputs.rootSlot ?? 'root') ? inputs.instance?.style : undefined),
        }
      },
    }
  }

  return {
    rootClass: (override) => resolveSlot(inputs.rootSlot ?? ('root' as S), override).class,
    rootStyle: (override) => resolveSlot(inputs.rootSlot ?? ('root' as S), override).style,
    rootClassAndStyle: (override) => ({
      get class() {
        return resolveSlot(inputs.rootSlot ?? ('root' as S), override).class
      },
      get style() {
        return resolveSlot(inputs.rootSlot ?? ('root' as S), override).style
      },
    }),
    slotClass: (slot, override) => resolveSlot(slot, override).class,
    slotStyle: (slot, override) => resolveSlot(slot, override).style,
    slotClassAndStyle: resolveSlot,
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

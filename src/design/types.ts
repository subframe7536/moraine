import type { AccordionT } from '../elements/accordion/index.ts'
import type { AvatarGroupT, AvatarT } from '../elements/avatar/index.ts'
import type { BadgeT } from '../elements/badge/index.ts'
import type { ButtonGroupT } from '../elements/button/button-group.types.ts'
import type { ButtonT } from '../elements/button/button.types.ts'
import type { CardT } from '../elements/card/index.ts'
import type { CollapsibleT } from '../elements/collapsible/index.ts'
import type { IconT } from '../elements/icon/index.ts'
import type { KbdGroupT, KbdT } from '../elements/kbd/index.ts'
import type { ProgressT } from '../elements/progress/index.ts'
import type { ResizableT } from '../elements/resizable/index.ts'
import type { SeparatorT } from '../elements/separator/index.ts'
import type { CheckboxGroupT } from '../forms/checkbox-group/index.ts'
import type { CheckboxT } from '../forms/checkbox/index.ts'
import type { FileUploadT } from '../forms/file-upload/index.ts'
import type { FormFieldT, FormT } from '../forms/form/index.ts'
import type { InputNumberT } from '../forms/input-number/index.ts'
import type { InputT } from '../forms/input/index.ts'
import type { RadioGroupT } from '../forms/radio-group/index.ts'
import type { MultiSelectT, SelectT } from '../forms/select/index.ts'
import type { SliderT } from '../forms/slider/index.ts'
import type { SwitchT } from '../forms/switch/index.ts'
import type { TextareaT } from '../forms/textarea/index.ts'
import type { BreadcrumbT } from '../navigation/breadcrumb/index.ts'
import type { CommandPaletteT } from '../navigation/command-palette/index.ts'
import type { PaginationT } from '../navigation/pagination/index.ts'
import type { SidebarFrameT } from '../navigation/sidebar-frame/sidebar-frame.types.ts'
import type { StepperT } from '../navigation/stepper/stepper.types.ts'
import type { TabsT } from '../navigation/tabs/tabs.types.ts'
import type { ContextMenuT } from '../overlays/context-menu/index.ts'
import type { DialogT } from '../overlays/dialog/index.ts'
import type { DropdownMenuT } from '../overlays/dropdown-menu/index.ts'
import type { ModalT } from '../overlays/modal/index.ts'
import type { PopoverT } from '../overlays/popover/index.ts'
import type { SheetT } from '../overlays/sheet/index.ts'
import type { TooltipT } from '../overlays/tooltip/index.ts'
import type { ClassValue, ResolvedSlotClasses } from '../shared/style/recipe.ts'

export const DESIGN_OPTIONS = Symbol.for('moraine.design.options')

type ComponentDesignVariantKey<T> = T extends boolean
  ? 'true' | 'false'
  : Extract<NonNullable<T>, string | number>

export type ComponentDesignVariants<S extends string, V> = [V] extends [never]
  ? never
  : {
      [K in keyof V]?: {
        [Val in ComponentDesignVariantKey<V[K]>]?: Partial<Record<S, ClassValue>>
      }
    }

type ComponentDesignMatch<V> = { [K in keyof V]?: V[K] | readonly NonNullable<V[K]>[] }

export type ComponentDesignCompoundVariant<S extends string, V> = [V] extends [never]
  ? never
  :
      | {
          variants: ComponentDesignMatch<V>
          class: Partial<Record<S, ClassValue>>
        }
      | (ComponentDesignMatch<V> & {
          class: Partial<Record<S, ClassValue>>
          variants?: never
        })

export interface ComponentDesignInput<S extends string = string, V = Record<string, unknown>> {
  base?: Partial<Record<S, ClassValue>>
  variants?: ComponentDesignVariants<S, V>
  compoundVariants?: readonly ComponentDesignCompoundVariant<S, V>[]
  defaultVariants?: [V] extends [never] ? never : { [K in keyof V]?: NonNullable<V[K]> }
}

export interface CompiledComponentDesign<S extends string = string, V = Record<string, unknown>> {
  recipe: {
    (variants?: V): ResolvedSlotClasses<S>
    readonly slots: readonly S[]
  }
  defaultVariants?: [V] extends [never] ? never : { [K in keyof V]?: NonNullable<V[K]> }
}

export interface MoraineDesign {
  readonly [DESIGN_OPTIONS]?: Record<string, ComponentDesignInput<string, any>>
  readonly accordion: CompiledComponentDesign<keyof AccordionT.Slot, AccordionT.Variant>
  readonly avatar: CompiledComponentDesign<keyof AvatarT.Slot, AvatarT.Variant>
  readonly avatarGroup: CompiledComponentDesign<keyof AvatarGroupT.Slot, AvatarGroupT.Variant>
  readonly badge: CompiledComponentDesign<keyof BadgeT.Slot, BadgeT.Variant>
  readonly breadcrumb: CompiledComponentDesign<keyof BreadcrumbT.Slot, BreadcrumbT.Variant>
  readonly button: CompiledComponentDesign<keyof ButtonT.Slot, ButtonT.Variant>
  readonly buttonGroup: CompiledComponentDesign<keyof ButtonGroupT.Slot, ButtonGroupT.Variant>
  readonly card: CompiledComponentDesign<keyof CardT.Slot, CardT.Variant>
  readonly checkbox: CompiledComponentDesign<keyof CheckboxT.Slot, CheckboxT.Variant>
  readonly checkboxGroup: CompiledComponentDesign<keyof CheckboxGroupT.Slot, CheckboxGroupT.Variant>
  readonly collapsible: CompiledComponentDesign<keyof CollapsibleT.Slot, CollapsibleT.Variant>
  readonly commandPalette: CompiledComponentDesign<
    keyof CommandPaletteT.Slot,
    CommandPaletteT.Variant
  >
  readonly contextMenu: CompiledComponentDesign<keyof ContextMenuT.Slot, ContextMenuT.Variant>
  readonly dialog: CompiledComponentDesign<keyof DialogT.Slot, DialogT.Variant>
  readonly dropdownMenu: CompiledComponentDesign<keyof DropdownMenuT.Slot, DropdownMenuT.Variant>
  readonly fileUpload: CompiledComponentDesign<keyof FileUploadT.Slot, FileUploadT.Variant>
  readonly form: CompiledComponentDesign<keyof FormT.Slot, FormT.Variant>
  readonly formField: CompiledComponentDesign<keyof FormFieldT.Slot, FormFieldT.Variant>
  readonly icon: CompiledComponentDesign<keyof IconT.Slot, IconT.Variant>
  readonly input: CompiledComponentDesign<keyof InputT.Slot, InputT.Variant>
  readonly inputNumber: CompiledComponentDesign<keyof InputNumberT.Slot, InputNumberT.Variant>
  readonly kbd: CompiledComponentDesign<keyof KbdT.Slot, KbdT.Variant>
  readonly kbdGroup: CompiledComponentDesign<keyof KbdGroupT.Slot, KbdGroupT.Variant>
  readonly modal: CompiledComponentDesign<keyof ModalT.Slot, ModalT.Variant>
  readonly multiSelect: CompiledComponentDesign<keyof MultiSelectT.Slot, MultiSelectT.Variant>
  readonly pagination: CompiledComponentDesign<keyof PaginationT.Slot, PaginationT.Variant>
  readonly popover: CompiledComponentDesign<keyof PopoverT.Slot, PopoverT.Variant>
  readonly progress: CompiledComponentDesign<keyof ProgressT.Slot, ProgressT.Variant>
  readonly radioGroup: CompiledComponentDesign<keyof RadioGroupT.Slot, RadioGroupT.Variant>
  readonly resizable: CompiledComponentDesign<keyof ResizableT.Slot, ResizableT.Variant>
  readonly select: CompiledComponentDesign<keyof SelectT.Slot, SelectT.Variant>
  readonly separator: CompiledComponentDesign<keyof SeparatorT.Slot, SeparatorT.Variant>
  readonly sheet: CompiledComponentDesign<keyof SheetT.Slot, SheetT.Variant>
  readonly sidebarFrame: CompiledComponentDesign<keyof SidebarFrameT.Slot, SidebarFrameT.Variant>
  readonly slider: CompiledComponentDesign<keyof SliderT.Slot, SliderT.Variant>
  readonly stepper: CompiledComponentDesign<keyof StepperT.Slot, StepperT.Variant>
  readonly switch: CompiledComponentDesign<keyof SwitchT.Slot, SwitchT.Variant>
  readonly tabs: CompiledComponentDesign<keyof TabsT.Slot, TabsT.Variant>
  readonly textarea: CompiledComponentDesign<keyof TextareaT.Slot, TextareaT.Variant>
  readonly tooltip: CompiledComponentDesign<keyof TooltipT.Slot, TooltipT.Variant>
}

export interface CreateDesignOptions {
  extends?: MoraineDesign
  preset?: boolean
  accordion?: ComponentDesignInput<keyof AccordionT.Slot, AccordionT.Variant>
  avatar?: ComponentDesignInput<keyof AvatarT.Slot, AvatarT.Variant>
  avatarGroup?: ComponentDesignInput<keyof AvatarGroupT.Slot, AvatarGroupT.Variant>
  badge?: ComponentDesignInput<keyof BadgeT.Slot, BadgeT.Variant>
  breadcrumb?: ComponentDesignInput<keyof BreadcrumbT.Slot, BreadcrumbT.Variant>
  button?: ComponentDesignInput<keyof ButtonT.Slot, ButtonT.Variant>
  buttonGroup?: ComponentDesignInput<keyof ButtonGroupT.Slot, ButtonGroupT.Variant>
  card?: ComponentDesignInput<keyof CardT.Slot, CardT.Variant>
  checkbox?: ComponentDesignInput<keyof CheckboxT.Slot, CheckboxT.Variant>
  checkboxGroup?: ComponentDesignInput<keyof CheckboxGroupT.Slot, CheckboxGroupT.Variant>
  collapsible?: ComponentDesignInput<keyof CollapsibleT.Slot, CollapsibleT.Variant>
  commandPalette?: ComponentDesignInput<keyof CommandPaletteT.Slot, CommandPaletteT.Variant>
  contextMenu?: ComponentDesignInput<keyof ContextMenuT.Slot, ContextMenuT.Variant>
  dialog?: ComponentDesignInput<keyof DialogT.Slot, DialogT.Variant>
  dropdownMenu?: ComponentDesignInput<keyof DropdownMenuT.Slot, DropdownMenuT.Variant>
  fileUpload?: ComponentDesignInput<keyof FileUploadT.Slot, FileUploadT.Variant>
  form?: ComponentDesignInput<keyof FormT.Slot, FormT.Variant>
  formField?: ComponentDesignInput<keyof FormFieldT.Slot, FormFieldT.Variant>
  icon?: ComponentDesignInput<keyof IconT.Slot, IconT.Variant>
  input?: ComponentDesignInput<keyof InputT.Slot, InputT.Variant>
  inputNumber?: ComponentDesignInput<keyof InputNumberT.Slot, InputNumberT.Variant>
  kbd?: ComponentDesignInput<keyof KbdT.Slot, KbdT.Variant>
  kbdGroup?: ComponentDesignInput<keyof KbdGroupT.Slot, KbdGroupT.Variant>
  modal?: ComponentDesignInput<keyof ModalT.Slot, ModalT.Variant>
  multiSelect?: ComponentDesignInput<keyof MultiSelectT.Slot, MultiSelectT.Variant>
  pagination?: ComponentDesignInput<keyof PaginationT.Slot, PaginationT.Variant>
  popover?: ComponentDesignInput<keyof PopoverT.Slot, PopoverT.Variant>
  progress?: ComponentDesignInput<keyof ProgressT.Slot, ProgressT.Variant>
  radioGroup?: ComponentDesignInput<keyof RadioGroupT.Slot, RadioGroupT.Variant>
  resizable?: ComponentDesignInput<keyof ResizableT.Slot, ResizableT.Variant>
  select?: ComponentDesignInput<keyof SelectT.Slot, SelectT.Variant>
  separator?: ComponentDesignInput<keyof SeparatorT.Slot, SeparatorT.Variant>
  sheet?: ComponentDesignInput<keyof SheetT.Slot, SheetT.Variant>
  sidebarFrame?: ComponentDesignInput<keyof SidebarFrameT.Slot, SidebarFrameT.Variant>
  slider?: ComponentDesignInput<keyof SliderT.Slot, SliderT.Variant>
  stepper?: ComponentDesignInput<keyof StepperT.Slot, StepperT.Variant>
  switch?: ComponentDesignInput<keyof SwitchT.Slot, SwitchT.Variant>
  tabs?: ComponentDesignInput<keyof TabsT.Slot, TabsT.Variant>
  textarea?: ComponentDesignInput<keyof TextareaT.Slot, TextareaT.Variant>
  tooltip?: ComponentDesignInput<keyof TooltipT.Slot, TooltipT.Variant>
}

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
import type { ComponentRecipeConfig } from '../shared/style/recipe.ts'

export const THEME_LAYERS: unique symbol = Symbol('moraine.theme.layers')

/** Component families and their locally declared presentation contracts. */
export interface MoraineThemeSchema {
  accordion: { slots: AccordionT.SlotName; variants: AccordionT.Variant }
  avatar: { slots: AvatarT.SlotName; variants: AvatarT.Variant }
  avatarGroup: { slots: AvatarGroupT.SlotName; variants: AvatarGroupT.Variant }
  badge: { slots: BadgeT.SlotName; variants: BadgeT.Variant }
  breadcrumb: { slots: BreadcrumbT.SlotName; variants: BreadcrumbT.Variant }
  button: { slots: ButtonT.SlotName; variants: ButtonT.Variant }
  buttonGroup: { slots: ButtonGroupT.SlotName; variants: ButtonGroupT.Variant }
  card: { slots: CardT.SlotName; variants: CardT.Variant }
  checkbox: { slots: CheckboxT.SlotName; variants: CheckboxT.Variant }
  checkboxGroup: { slots: CheckboxGroupT.SlotName; variants: CheckboxGroupT.Variant }
  collapsible: { slots: CollapsibleT.SlotName; variants: CollapsibleT.Variant }
  commandPalette: { slots: CommandPaletteT.SlotName; variants: CommandPaletteT.Variant }
  contextMenu: { slots: ContextMenuT.SlotName; variants: ContextMenuT.Variant }
  dialog: { slots: DialogT.SlotName; variants: DialogT.Variant }
  dropdownMenu: { slots: DropdownMenuT.SlotName; variants: DropdownMenuT.Variant }
  fileUpload: { slots: FileUploadT.SlotName; variants: FileUploadT.Variant }
  form: { slots: FormT.SlotName; variants: FormT.Variant }
  formField: { slots: FormFieldT.SlotName; variants: FormFieldT.Variant }
  icon: { slots: IconT.SlotName; variants: IconT.Variant }
  input: { slots: InputT.SlotName; variants: InputT.Variant }
  inputNumber: { slots: InputNumberT.SlotName; variants: InputNumberT.Variant }
  kbd: { slots: KbdT.SlotName; variants: KbdT.Variant }
  kbdGroup: { slots: KbdGroupT.SlotName; variants: KbdGroupT.Variant }
  modal: { slots: ModalT.SlotName; variants: ModalT.Variant }
  multiSelect: { slots: MultiSelectT.SlotName; variants: MultiSelectT.Variant }
  pagination: { slots: PaginationT.SlotName; variants: PaginationT.Variant }
  popover: { slots: PopoverT.SlotName; variants: PopoverT.Variant }
  progress: { slots: ProgressT.SlotName; variants: ProgressT.Variant }
  radioGroup: { slots: RadioGroupT.SlotName; variants: RadioGroupT.Variant }
  resizable: { slots: ResizableT.SlotName; variants: ResizableT.Variant }
  select: { slots: SelectT.SlotName; variants: SelectT.Variant }
  separator: { slots: SeparatorT.SlotName; variants: SeparatorT.Variant }
  sheet: { slots: SheetT.SlotName; variants: SheetT.Variant }
  sidebarFrame: { slots: SidebarFrameT.SlotName; variants: SidebarFrameT.Variant }
  slider: { slots: SliderT.SlotName; variants: SliderT.Variant }
  stepper: { slots: StepperT.SlotName; variants: StepperT.Variant }
  switch: { slots: SwitchT.SlotName; variants: SwitchT.Variant }
  tabs: { slots: TabsT.SlotName; variants: TabsT.Variant }
  textarea: { slots: TextareaT.SlotName; variants: TextareaT.Variant }
  tooltip: { slots: TooltipT.SlotName; variants: TooltipT.Variant }
}

export type ThemeName = keyof MoraineThemeSchema
export type ThemeSlots<Name extends ThemeName> = MoraineThemeSchema[Name]['slots']
export type ThemeVariants<Name extends ThemeName> = MoraineThemeSchema[Name]['variants']

export interface CompiledComponentRecipe {
  readonly recipe: {
    (variants?: object): Partial<Record<string, string | undefined>>
    readonly options: unknown
  }
  readonly defaults?: Readonly<Record<string, unknown>>
}

export type CompiledThemeLayer = Readonly<Partial<Record<ThemeName, CompiledComponentRecipe>>>

/** Immutable ordered presentation layers, constructed with createTheme. */
export interface MoraineTheme {
  readonly [THEME_LAYERS]: readonly CompiledThemeLayer[]
}

type ThemeEntries = {
  [Name in ThemeName]?: ComponentRecipeConfig<ThemeSlots<Name>, ThemeVariants<Name>>
}

/** Sparse component Recipes and an optional parent Theme. */
export interface CreateThemeOptions extends ThemeEntries {
  /** Parent layers evaluated before this Theme's own layer. */
  extends?: MoraineTheme
}

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
import type { ComponentRecipeConfig, SlotRecipeFn } from '../shared/style/recipe.ts'

/** Component families and their locally declared presentation contracts. */
export interface MoraineThemeSchema {
  accordion: { slots: AccordionT.Slot; variants: AccordionT.Variant }
  avatar: { slots: AvatarT.Slot; variants: AvatarT.Variant }
  avatarGroup: { slots: AvatarGroupT.Slot; variants: AvatarGroupT.Variant }
  badge: { slots: BadgeT.Slot; variants: BadgeT.Variant }
  breadcrumb: { slots: BreadcrumbT.Slot; variants: BreadcrumbT.Variant }
  button: { slots: ButtonT.Slot; variants: ButtonT.Variant }
  buttonGroup: { slots: ButtonGroupT.Slot; variants: ButtonGroupT.Variant }
  card: { slots: CardT.Slot; variants: CardT.Variant }
  checkbox: { slots: CheckboxT.Slot; variants: CheckboxT.Variant }
  checkboxGroup: { slots: CheckboxGroupT.Slot; variants: CheckboxGroupT.Variant }
  collapsible: { slots: CollapsibleT.Slot; variants: CollapsibleT.Variant }
  commandPalette: { slots: CommandPaletteT.Slot; variants: CommandPaletteT.Variant }
  contextMenu: { slots: ContextMenuT.Slot; variants: ContextMenuT.Variant }
  dialog: { slots: DialogT.Slot; variants: DialogT.Variant }
  dropdownMenu: { slots: DropdownMenuT.Slot; variants: DropdownMenuT.Variant }
  fileUpload: { slots: FileUploadT.Slot; variants: FileUploadT.Variant }
  form: { slots: FormT.Slot; variants: FormT.Variant }
  formField: { slots: FormFieldT.Slot; variants: FormFieldT.Variant }
  icon: { slots: IconT.Slot; variants: IconT.Variant }
  input: { slots: InputT.Slot; variants: InputT.Variant }
  inputNumber: { slots: InputNumberT.Slot; variants: InputNumberT.Variant }
  kbd: { slots: KbdT.Slot; variants: KbdT.Variant }
  kbdGroup: { slots: KbdGroupT.Slot; variants: KbdGroupT.Variant }
  modal: { slots: ModalT.Slot; variants: ModalT.Variant }
  multiSelect: { slots: MultiSelectT.Slot; variants: MultiSelectT.Variant }
  pagination: { slots: PaginationT.Slot; variants: PaginationT.Variant }
  popover: { slots: PopoverT.Slot; variants: PopoverT.Variant }
  progress: { slots: ProgressT.Slot; variants: ProgressT.Variant }
  radioGroup: { slots: RadioGroupT.Slot; variants: RadioGroupT.Variant }
  resizable: { slots: ResizableT.Slot; variants: ResizableT.Variant }
  select: { slots: SelectT.Slot; variants: SelectT.Variant }
  separator: { slots: SeparatorT.Slot; variants: SeparatorT.Variant }
  sheet: { slots: SheetT.Slot; variants: SheetT.Variant }
  sidebarFrame: { slots: SidebarFrameT.Slot; variants: SidebarFrameT.Variant }
  slider: { slots: SliderT.Slot; variants: SliderT.Variant }
  stepper: { slots: StepperT.Slot; variants: StepperT.Variant }
  switch: { slots: SwitchT.Slot; variants: SwitchT.Variant }
  tabs: { slots: TabsT.Slot; variants: TabsT.Variant }
  textarea: { slots: TextareaT.Slot; variants: TextareaT.Variant }
  tooltip: { slots: TooltipT.Slot; variants: TooltipT.Variant }
}

export type ThemeName = keyof MoraineThemeSchema
export type ThemeSlots<Name extends ThemeName> = Extract<
  keyof MoraineThemeSchema[Name]['slots'],
  string
>
export type ThemeVariants<Name extends ThemeName> = MoraineThemeSchema[Name]['variants']

export interface ComponentThemeEntry<S extends object, V> {
  readonly defaults?: ComponentRecipeConfig<S, V>['defaults']
  readonly recipes: readonly SlotRecipeFn<S, V>[]
}

/** Component presentation. Replace the theme object to update consumers. */
export type MoraineTheme = {
  readonly [Name in ThemeName]?: ComponentThemeEntry<
    MoraineThemeSchema[Name]['slots'],
    ThemeVariants<Name>
  >
}

/** Clears inherited presentation when passed to MoraineProvider. */
export const emptyTheme: MoraineTheme = Object.freeze({})

type ThemeEntries = {
  [Name in ThemeName]?: ComponentRecipeConfig<
    MoraineThemeSchema[Name]['slots'],
    ThemeVariants<Name>
  >
}

/** Component recipe configurations and an optional parent theme. */
export interface CreateThemeOptions extends ThemeEntries {
  /** Theme extended by these component configurations. */
  extends?: MoraineTheme
}

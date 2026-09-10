import type { AccordionT } from '../elements/accordion'
import type { AvatarGroupT, AvatarT } from '../elements/avatar'
import type { BadgeT } from '../elements/badge'
import type { ButtonGroupT } from '../elements/button/button-group.types'
import type { ButtonT } from '../elements/button/button.types'
import type { CardT } from '../elements/card'
import type { CollapsibleT } from '../elements/collapsible'
import type { IconT } from '../elements/icon'
import type { KbdGroupT, KbdT } from '../elements/kbd'
import type { ProgressT } from '../elements/progress'
import type { ResizableT } from '../elements/resizable'
import type { SeparatorT } from '../elements/separator'
import type { CheckboxT } from '../forms/checkbox'
import type { CheckboxGroupT } from '../forms/checkbox-group'
import type { FileUploadT } from '../forms/file-upload'
import type { FormFieldT, FormT } from '../forms/form'
import type { InputT } from '../forms/input'
import type { InputNumberT } from '../forms/input-number'
import type { RadioGroupT } from '../forms/radio-group'
import type { MultiSelectT, SelectT } from '../forms/select'
import type { SliderT } from '../forms/slider'
import type { SwitchT } from '../forms/switch'
import type { TextareaT } from '../forms/textarea'
import type { BreadcrumbT } from '../navigation/breadcrumb'
import type { CommandPaletteT } from '../navigation/command-palette'
import type { PaginationT } from '../navigation/pagination'
import type { SidebarFrameT } from '../navigation/sidebar-frame/sidebar-frame.types'
import type { StepperT } from '../navigation/stepper/stepper.types'
import type { TabsT } from '../navigation/tabs/tabs.types'
import type { ContextMenuT } from '../overlays/context-menu'
import type { DialogT } from '../overlays/dialog'
import type { DropdownMenuT } from '../overlays/dropdown-menu'
import type { ModalT } from '../overlays/modal'
import type { PopoverT } from '../overlays/popover'
import type { SheetT } from '../overlays/sheet'
import type { TooltipT } from '../overlays/tooltip'
import type { ComponentRecipeConfig, SlotRecipeFn } from '../shared/style/recipe'

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

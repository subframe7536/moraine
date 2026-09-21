import { Icon, Kbd, createForm } from 'moraine'
import type {
  AccordionT,
  AvatarGroupT,
  AvatarT,
  BadgeT,
  BaseSelectT,
  BreadcrumbT,
  ButtonGroupT,
  ButtonT,
  CardT,
  CheckboxGroupT,
  CheckboxT,
  CollapsibleT,
  ComboboxT,
  CommandPaletteT,
  ContextMenuT,
  DialogT,
  DropdownMenuT,
  FieldT,
  FileUploadT,
  FormT,
  IconT,
  InputGroupT,
  InputNumberT,
  InputT,
  KbdGroupT,
  KbdT,
  ListT,
  ModalT,
  MultiSelectT,
  PaginationT,
  PopoverT,
  ProgressT,
  RadioGroupT,
  ResizableT,
  SelectT,
  SeparatorT,
  SheetT,
  SidebarFrameT,
  SliderT,
  StepperT,
  SwitchT,
  TabsT,
  TextareaT,
  TooltipT,
} from 'moraine'
import * as v from 'valibot'

type Header<Kind, Slot, Variant, Classes, Styles> = [Kind, Slot, Variant, Classes, Styles]

export type ComponentNamespaceHeaders = {
  Accordion: Header<
    AccordionT.Kind,
    AccordionT.Slot,
    AccordionT.Variant,
    AccordionT.Classes,
    AccordionT.Styles
  >
  AvatarGroup: Header<
    AvatarGroupT.Kind,
    AvatarGroupT.Slot,
    AvatarGroupT.Variant,
    AvatarGroupT.Classes,
    AvatarGroupT.Styles
  >
  Avatar: Header<AvatarT.Kind, AvatarT.Slot, AvatarT.Variant, AvatarT.Classes, AvatarT.Styles>
  Badge: Header<BadgeT.Kind, BadgeT.Slot, BadgeT.Variant, BadgeT.Classes, BadgeT.Styles>
  BaseSelect: Header<
    BaseSelectT.Kind,
    BaseSelectT.Slot,
    BaseSelectT.Variant,
    BaseSelectT.Classes,
    BaseSelectT.Styles
  >
  Breadcrumb: Header<
    BreadcrumbT.Kind,
    BreadcrumbT.Slot,
    BreadcrumbT.Variant,
    BreadcrumbT.Classes,
    BreadcrumbT.Styles
  >
  ButtonGroup: Header<
    ButtonGroupT.Kind,
    ButtonGroupT.Slot,
    ButtonGroupT.Variant,
    ButtonGroupT.Classes,
    ButtonGroupT.Styles
  >
  Button: Header<ButtonT.Kind, ButtonT.Slot, ButtonT.Variant, ButtonT.Classes, ButtonT.Styles>
  Card: Header<CardT.Kind, CardT.Slot, CardT.Variant, CardT.Classes, CardT.Styles>
  CheckboxGroup: Header<
    CheckboxGroupT.Kind,
    CheckboxGroupT.Slot,
    CheckboxGroupT.Variant,
    CheckboxGroupT.Classes,
    CheckboxGroupT.Styles
  >
  Checkbox: Header<
    CheckboxT.Kind,
    CheckboxT.Slot,
    CheckboxT.Variant,
    CheckboxT.Classes,
    CheckboxT.Styles
  >
  Collapsible: Header<
    CollapsibleT.Kind,
    CollapsibleT.Slot,
    CollapsibleT.Variant,
    CollapsibleT.Classes,
    CollapsibleT.Styles
  >
  Combobox: Header<
    ComboboxT.Kind,
    ComboboxT.Slot,
    ComboboxT.Variant,
    ComboboxT.Classes,
    ComboboxT.Styles
  >
  CommandPalette: Header<
    CommandPaletteT.Kind,
    CommandPaletteT.Slot,
    CommandPaletteT.Variant,
    CommandPaletteT.Classes,
    CommandPaletteT.Styles
  >
  ContextMenu: Header<
    ContextMenuT.Kind,
    ContextMenuT.Slot,
    ContextMenuT.Variant,
    ContextMenuT.Classes,
    ContextMenuT.Styles
  >
  Dialog: Header<DialogT.Kind, DialogT.Slot, DialogT.Variant, DialogT.Classes, DialogT.Styles>
  DropdownMenu: Header<
    DropdownMenuT.Kind,
    DropdownMenuT.Slot,
    DropdownMenuT.Variant,
    DropdownMenuT.Classes,
    DropdownMenuT.Styles
  >
  Field: Header<FieldT.Kind, FieldT.Slot, FieldT.Variant, FieldT.Classes, FieldT.Styles>
  FileUpload: Header<
    FileUploadT.Kind,
    FileUploadT.Slot,
    FileUploadT.Variant,
    FileUploadT.Classes,
    FileUploadT.Styles
  >
  Form: Header<FormT.Kind, FormT.Slot, FormT.Variant, FormT.Classes, FormT.Styles>
  Icon: Header<IconT.Kind, IconT.Slot, IconT.Variant, IconT.Classes, IconT.Styles>
  InputGroup: Header<
    InputGroupT.Kind,
    InputGroupT.Slot,
    InputGroupT.Variant,
    InputGroupT.Classes,
    InputGroupT.Styles
  >
  InputNumber: Header<
    InputNumberT.Kind,
    InputNumberT.Slot,
    InputNumberT.Variant,
    InputNumberT.Classes,
    InputNumberT.Styles
  >
  Input: Header<InputT.Kind, InputT.Slot, InputT.Variant, InputT.Classes, InputT.Styles>
  KbdGroup: Header<
    KbdGroupT.Kind,
    KbdGroupT.Slot,
    KbdGroupT.Variant,
    KbdGroupT.Classes,
    KbdGroupT.Styles
  >
  Kbd: Header<KbdT.Kind, KbdT.Slot, KbdT.Variant, KbdT.Classes, KbdT.Styles>
  List: Header<ListT.Kind, ListT.Slot, ListT.Variant, ListT.Classes, ListT.Styles>
  Modal: Header<ModalT.Kind, ModalT.Slot, ModalT.Variant, ModalT.Classes, ModalT.Styles>
  MultiSelect: Header<
    MultiSelectT.Kind,
    MultiSelectT.Slot,
    MultiSelectT.Variant,
    MultiSelectT.Classes,
    MultiSelectT.Styles
  >
  Pagination: Header<
    PaginationT.Kind,
    PaginationT.Slot,
    PaginationT.Variant,
    PaginationT.Classes,
    PaginationT.Styles
  >
  Popover: Header<PopoverT.Kind, PopoverT.Slot, PopoverT.Variant, PopoverT.Classes, PopoverT.Styles>
  Progress: Header<
    ProgressT.Kind,
    ProgressT.Slot,
    ProgressT.Variant,
    ProgressT.Classes,
    ProgressT.Styles
  >
  RadioGroup: Header<
    RadioGroupT.Kind,
    RadioGroupT.Slot,
    RadioGroupT.Variant,
    RadioGroupT.Classes,
    RadioGroupT.Styles
  >
  Resizable: Header<
    ResizableT.Kind,
    ResizableT.Slot,
    ResizableT.Variant,
    ResizableT.Classes,
    ResizableT.Styles
  >
  Select: Header<SelectT.Kind, SelectT.Slot, SelectT.Variant, SelectT.Classes, SelectT.Styles>
  Separator: Header<
    SeparatorT.Kind,
    SeparatorT.Slot,
    SeparatorT.Variant,
    SeparatorT.Classes,
    SeparatorT.Styles
  >
  Sheet: Header<SheetT.Kind, SheetT.Slot, SheetT.Variant, SheetT.Classes, SheetT.Styles>
  SidebarFrame: Header<
    SidebarFrameT.Kind,
    SidebarFrameT.Slot,
    SidebarFrameT.Variant,
    SidebarFrameT.Classes,
    SidebarFrameT.Styles
  >
  Slider: Header<SliderT.Kind, SliderT.Slot, SliderT.Variant, SliderT.Classes, SliderT.Styles>
  Stepper: Header<StepperT.Kind, StepperT.Slot, StepperT.Variant, StepperT.Classes, StepperT.Styles>
  Switch: Header<SwitchT.Kind, SwitchT.Slot, SwitchT.Variant, SwitchT.Classes, SwitchT.Styles>
  Tabs: Header<TabsT.Kind, TabsT.Slot, TabsT.Variant, TabsT.Classes, TabsT.Styles>
  Textarea: Header<
    TextareaT.Kind,
    TextareaT.Slot,
    TextareaT.Variant,
    TextareaT.Classes,
    TextareaT.Styles
  >
  Tooltip: Header<TooltipT.Kind, TooltipT.Slot, TooltipT.Variant, TooltipT.Classes, TooltipT.Styles>
}

type IsNever<T> = [T] extends [never] ? true : false
type Assert<T extends true> = T

export type ListStyleContract = [
  Assert<IsNever<ListT.Slot>>,
  Assert<IsNever<ListT.Variant>>,
  Assert<IsNever<ListT.Classes>>,
  Assert<IsNever<ListT.Styles>>,
]

;<Icon name="icon-search" classes={{ root: 'text-primary' }} styles={{ root: { color: 'red' } }} />
;<Kbd value="K" classes={{ root: 'text-primary' }} styles={{ root: { color: 'red' } }} />

const Schema = v.object({ name: v.string() })
const form = createForm({ schema: Schema })
;<form.Form classes={{ root: 'space-y-2' }} styles={{ root: { color: 'red' } }} />

export type RetainedNamespaceMembers = [
  IconT.Name,
  KbdT.Key,
  AvatarT.Status,
  FieldT.Name,
  FileUploadT.Value,
  FormT.FieldName<typeof Schema>,
  FormT.Instance<typeof Schema>,
  InputNumberT.PointerType,
  StepperT.Value,
  SelectT.Row,
  SelectT.Entry,
  ComboboxT.Row,
  MultiSelectT.TagRenderProps,
  SidebarFrameT.Context,
  DialogT.ContentClasses,
  SheetT.ContentStyles,
  FieldT.RenderProps,
  ResizableT.HandleRenderProps,
  ModalT.ContentRenderProps,
  BaseSelectT.TriggerRenderProps,
  BaseSelectT.ItemRenderProps,
]

export type CompositePartContracts = [
  ButtonGroupT.SeparatorBase,
  ButtonGroupT.SeparatorProps,
  CollapsibleT.TriggerBase,
  CollapsibleT.TriggerProps,
  CollapsibleT.ContentBase,
  CollapsibleT.ContentProps,
  ResizableT.PanelBase,
  ResizableT.PanelProps,
  ResizableT.HandleBase,
  ResizableT.HandleProps,
  InputGroupT.LeadingBase,
  InputGroupT.LeadingProps,
  InputGroupT.TrailingBase,
  InputGroupT.TrailingProps,
  SidebarFrameT.SidebarBase,
  SidebarFrameT.SidebarProps,
  SidebarFrameT.SidebarHeaderBase,
  SidebarFrameT.SidebarHeaderProps,
  SidebarFrameT.SidebarBodyBase,
  SidebarFrameT.SidebarBodyProps,
  SidebarFrameT.SidebarFooterBase,
  SidebarFrameT.SidebarFooterProps,
  SidebarFrameT.MainBase,
  SidebarFrameT.MainProps,
  SidebarFrameT.TriggerBase,
  SidebarFrameT.TriggerProps,
  ModalT.TriggerBase,
  ModalT.TriggerProps,
  ModalT.OverlayBase,
  ModalT.OverlayProps,
  ModalT.ContentBase,
  ModalT.ContentProps,
  ModalT.CloseBase,
  ModalT.CloseProps,
  DialogT.TriggerBase,
  DialogT.TriggerProps,
  DialogT.ContentBase,
  DialogT.ContentProps,
  DialogT.CloseBase,
  DialogT.CloseProps,
  SheetT.TriggerBase,
  SheetT.TriggerProps,
  SheetT.ContentBase,
  SheetT.ContentProps,
  SheetT.CloseBase,
  SheetT.CloseProps,
  PopoverT.TriggerBase,
  PopoverT.TriggerProps,
  PopoverT.ContentBase,
  PopoverT.ContentProps,
  PopoverT.CloseBase,
  PopoverT.CloseProps,
  TooltipT.TriggerBase,
  TooltipT.TriggerProps,
  TooltipT.ContentBase,
  TooltipT.ContentProps,
  DropdownMenuT.TriggerBase,
  DropdownMenuT.TriggerProps,
  DropdownMenuT.ContentBase,
  DropdownMenuT.ContentProps,
  ContextMenuT.TriggerBase,
  ContextMenuT.TriggerProps,
  ContextMenuT.ContentBase,
  ContextMenuT.ContentProps,
  BaseSelectT.TriggerBase,
  BaseSelectT.TriggerProps,
  BaseSelectT.ControlBase,
  BaseSelectT.ControlProps,
  BaseSelectT.ContentBase,
  BaseSelectT.ContentProps,
  BaseSelectT.ItemBase,
  BaseSelectT.ItemProps,
]

// @ts-expect-error Built-in alias keys are an implementation detail.
type RemovedKbdBuiltinKbds = KbdT.BuiltinKbds
// @ts-expect-error Recursive field paths are an implementation detail.
type RemovedFieldPath = FieldT.Path
// @ts-expect-error ValidationMode is not part of the Form component contract.
type RemovedFormValidationMode = FormT.ValidationMode
// @ts-expect-error Orientation has no independent public use.
type RemovedInputNumberOrientation = InputNumberT.Orientation
// @ts-expect-error BaseSelect composition helpers are internal.
type RemovedBaseSelectFieldProps = BaseSelectT.FieldProps
// @ts-expect-error BaseSelect composition helpers are internal.
type RemovedBaseSelectDisclosureProps = BaseSelectT.DisclosureProps
// @ts-expect-error BaseSelect composition helpers are internal.
type RemovedBaseSelectItemBehaviorProps = BaseSelectT.ItemBehaviorProps<BaseSelectT.Item>
// @ts-expect-error BaseSelect composition helpers are internal.
type RemovedBaseSelectCloseOnSelectOption = BaseSelectT.CloseOnSelectOption
// @ts-expect-error BaseSelect composition helpers are internal.
type RemovedBaseSelectResetProps = BaseSelectT.ResetProps
// @ts-expect-error BaseSelect selection helpers are internal.
type RemovedBaseSelectSelection = BaseSelectT.Selection<string>
// @ts-expect-error BaseSelect structural part helpers are internal.
type RemovedBaseSelectPartProps = BaseSelectT.PartProps
// @ts-expect-error BaseSelect item-value helpers are internal.
type RemovedBaseSelectItemValue = BaseSelectT.ItemValue<BaseSelectT.Item>
// @ts-expect-error Generic select values are expressed through Item['value'].
type RemovedBaseSelectValue = BaseSelectT.Value
// @ts-expect-error Generic select values are expressed through Item['value'].
type RemovedSelectValue = SelectT.Value
// @ts-expect-error Generic select values are expressed through Item['value'].
type RemovedComboboxValue = ComboboxT.Value
// @ts-expect-error Generic select values are expressed through Item['value'].
type RemovedMultiSelectValue = MultiSelectT.Value
// @ts-expect-error Select-family ownership helpers are internal.
type RemovedSelectControlSlot = SelectT.ControlSlot
// @ts-expect-error Select-family ownership helpers are internal.
type RemovedSelectItemSlot = SelectT.ItemSlot
// @ts-expect-error Select-family ownership helpers are internal.
type RemovedComboboxControlSlot = ComboboxT.ControlSlot
// @ts-expect-error Select-family ownership helpers are internal.
type RemovedComboboxItemSlot = ComboboxT.ItemSlot
// @ts-expect-error Select-family ownership helpers are internal.
type RemovedMultiSelectControlSlot = MultiSelectT.ControlSlot
// @ts-expect-error Select-family ownership helpers are internal.
type RemovedMultiSelectItemSlot = MultiSelectT.ItemSlot
// @ts-expect-error DescriptionPosition is represented by the recipe variant.
type RemovedCommandPaletteDescriptionPosition = CommandPaletteT.DescriptionPosition
// @ts-expect-error The shared render base is internal.
type RemovedCommandPaletteBaseContext = CommandPaletteT.BaseContext
// @ts-expect-error Render callback props use the RenderProps suffix.
type RemovedFieldRenderContext = FieldT.RenderContext
// @ts-expect-error Render callback props use the RenderProps suffix.
type RemovedResizableHandleContext = ResizableT.HandleContext
// @ts-expect-error Render callback props use the RenderProps suffix.
type RemovedModalContentContext = ModalT.ContentContext
// @ts-expect-error Render callback props use the RenderProps suffix.
type RemovedBaseSelectTriggerState = BaseSelectT.TriggerState
// @ts-expect-error Render callback props use the RenderProps suffix.
type RemovedBaseSelectItemState = BaseSelectT.ItemState
// @ts-expect-error Wrapper render-state helpers were replaced by ItemRenderProps.
type RemovedSelectItemRenderState = SelectT.ItemRenderState
// @ts-expect-error Wrapper render-state helpers were replaced by ItemRenderProps.
type RemovedComboboxItemRenderState = ComboboxT.ItemRenderState
// @ts-expect-error Wrapper render-state helpers were replaced by ItemRenderProps.
type RemovedMultiSelectItemRenderState = MultiSelectT.ItemRenderState

export type RemovedNamespaceMembers = [
  RemovedKbdBuiltinKbds,
  RemovedFieldPath,
  RemovedFormValidationMode,
  RemovedInputNumberOrientation,
  RemovedBaseSelectFieldProps,
  RemovedBaseSelectDisclosureProps,
  RemovedBaseSelectItemBehaviorProps,
  RemovedBaseSelectCloseOnSelectOption,
  RemovedBaseSelectResetProps,
  RemovedBaseSelectSelection,
  RemovedBaseSelectPartProps,
  RemovedBaseSelectItemValue,
  RemovedBaseSelectValue,
  RemovedSelectValue,
  RemovedComboboxValue,
  RemovedMultiSelectValue,
  RemovedSelectControlSlot,
  RemovedSelectItemSlot,
  RemovedComboboxControlSlot,
  RemovedComboboxItemSlot,
  RemovedMultiSelectControlSlot,
  RemovedMultiSelectItemSlot,
  RemovedCommandPaletteDescriptionPosition,
  RemovedCommandPaletteBaseContext,
  RemovedFieldRenderContext,
  RemovedResizableHandleContext,
  RemovedModalContentContext,
  RemovedBaseSelectTriggerState,
  RemovedBaseSelectItemState,
  RemovedSelectItemRenderState,
  RemovedComboboxItemRenderState,
  RemovedMultiSelectItemRenderState,
]

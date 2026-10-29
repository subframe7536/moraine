import { Button, Icon, Kbd, Select, createForm, createTree } from 'moraine'
import type {
  AccordionT,
  AlertDialogT,
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
  CopyButtonT,
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
  SidebarT,
  SliderT,
  StepperT,
  SwitchT,
  TableT,
  TabsT,
  TextareaT,
  TooltipT,
  TreeT,
} from 'moraine'
import type { DataTableT } from 'moraine/data-table'
import * as v from 'valibot'

type Header<Kind, Slot, Variants, Classes, Styles> = [Kind, Slot, Variants, Classes, Styles]

export type ComponentNamespaceHeaders = {
  Accordion: Header<
    AccordionT.Kind,
    AccordionT.Slot,
    AccordionT.Variants,
    AccordionT.Classes,
    AccordionT.Styles
  >
  AlertDialog: Header<
    AlertDialogT.Kind,
    AlertDialogT.Slot,
    AlertDialogT.Variants,
    AlertDialogT.Classes,
    AlertDialogT.Styles
  >
  AvatarGroup: Header<
    AvatarGroupT.Kind,
    AvatarGroupT.Slot,
    AvatarGroupT.Variants,
    AvatarGroupT.Classes,
    AvatarGroupT.Styles
  >
  Avatar: Header<AvatarT.Kind, AvatarT.Slot, AvatarT.Variants, AvatarT.Classes, AvatarT.Styles>
  Badge: Header<BadgeT.Kind, BadgeT.Slot, BadgeT.Variants, BadgeT.Classes, BadgeT.Styles>
  BaseSelect: Header<
    BaseSelectT.Kind,
    BaseSelectT.Slot,
    BaseSelectT.Variants,
    BaseSelectT.Classes,
    BaseSelectT.Styles
  >
  Breadcrumb: Header<
    BreadcrumbT.Kind,
    BreadcrumbT.Slot,
    BreadcrumbT.Variants,
    BreadcrumbT.Classes,
    BreadcrumbT.Styles
  >
  ButtonGroup: Header<
    ButtonGroupT.Kind,
    ButtonGroupT.Slot,
    ButtonGroupT.Variants,
    ButtonGroupT.Classes,
    ButtonGroupT.Styles
  >
  Button: Header<ButtonT.Kind, ButtonT.Slot, ButtonT.Variants, ButtonT.Classes, ButtonT.Styles>
  Card: Header<CardT.Kind, CardT.Slot, CardT.Variants, CardT.Classes, CardT.Styles>
  CheckboxGroup: Header<
    CheckboxGroupT.Kind,
    CheckboxGroupT.Slot,
    CheckboxGroupT.Variants,
    CheckboxGroupT.Classes,
    CheckboxGroupT.Styles
  >
  Checkbox: Header<
    CheckboxT.Kind,
    CheckboxT.Slot,
    CheckboxT.Variants,
    CheckboxT.Classes,
    CheckboxT.Styles
  >
  Collapsible: Header<
    CollapsibleT.Kind,
    CollapsibleT.Slot,
    CollapsibleT.Variants,
    CollapsibleT.Classes,
    CollapsibleT.Styles
  >
  Combobox: Header<
    ComboboxT.Kind,
    ComboboxT.Slot,
    ComboboxT.Variants,
    ComboboxT.Classes,
    ComboboxT.Styles
  >
  CommandPalette: Header<
    CommandPaletteT.Kind,
    CommandPaletteT.Slot,
    CommandPaletteT.Variants,
    CommandPaletteT.Classes,
    CommandPaletteT.Styles
  >
  ContextMenu: Header<
    ContextMenuT.Kind,
    ContextMenuT.Slot,
    ContextMenuT.Variants,
    ContextMenuT.Classes,
    ContextMenuT.Styles
  >
  CopyButton: Header<
    CopyButtonT.Kind,
    CopyButtonT.Slot,
    CopyButtonT.Variants,
    CopyButtonT.Classes,
    CopyButtonT.Styles
  >
  DataTable: Header<
    DataTableT.Kind,
    DataTableT.Slot,
    DataTableT.Variants,
    DataTableT.Classes,
    DataTableT.Styles
  >
  Dialog: Header<DialogT.Kind, DialogT.Slot, DialogT.Variants, DialogT.Classes, DialogT.Styles>
  DropdownMenu: Header<
    DropdownMenuT.Kind,
    DropdownMenuT.Slot,
    DropdownMenuT.Variants,
    DropdownMenuT.Classes,
    DropdownMenuT.Styles
  >
  Field: Header<FieldT.Kind, FieldT.Slot, FieldT.Variants, FieldT.Classes, FieldT.Styles>
  FileUpload: Header<
    FileUploadT.Kind,
    FileUploadT.Slot,
    FileUploadT.Variants,
    FileUploadT.Classes,
    FileUploadT.Styles
  >
  Form: Header<FormT.Kind, FormT.Slot, FormT.Variants, FormT.Classes, FormT.Styles>
  Icon: Header<IconT.Kind, IconT.Slot, IconT.Variants, IconT.Classes, IconT.Styles>
  InputGroup: Header<
    InputGroupT.Kind,
    InputGroupT.Slot,
    InputGroupT.Variants,
    InputGroupT.Classes,
    InputGroupT.Styles
  >
  InputNumber: Header<
    InputNumberT.Kind,
    InputNumberT.Slot,
    InputNumberT.Variants,
    InputNumberT.Classes,
    InputNumberT.Styles
  >
  Input: Header<InputT.Kind, InputT.Slot, InputT.Variants, InputT.Classes, InputT.Styles>
  KbdGroup: Header<
    KbdGroupT.Kind,
    KbdGroupT.Slot,
    KbdGroupT.Variants,
    KbdGroupT.Classes,
    KbdGroupT.Styles
  >
  Kbd: Header<KbdT.Kind, KbdT.Slot, KbdT.Variants, KbdT.Classes, KbdT.Styles>
  List: Header<ListT.Kind, ListT.Slot, ListT.Variants, ListT.Classes, ListT.Styles>
  Modal: Header<ModalT.Kind, ModalT.Slot, ModalT.Variants, ModalT.Classes, ModalT.Styles>
  MultiSelect: Header<
    MultiSelectT.Kind,
    MultiSelectT.Slot,
    MultiSelectT.Variants,
    MultiSelectT.Classes,
    MultiSelectT.Styles
  >
  Pagination: Header<
    PaginationT.Kind,
    PaginationT.Slot,
    PaginationT.Variants,
    PaginationT.Classes,
    PaginationT.Styles
  >
  Popover: Header<
    PopoverT.Kind,
    PopoverT.Slot,
    PopoverT.Variants,
    PopoverT.Classes,
    PopoverT.Styles
  >
  Progress: Header<
    ProgressT.Kind,
    ProgressT.Slot,
    ProgressT.Variants,
    ProgressT.Classes,
    ProgressT.Styles
  >
  RadioGroup: Header<
    RadioGroupT.Kind,
    RadioGroupT.Slot,
    RadioGroupT.Variants,
    RadioGroupT.Classes,
    RadioGroupT.Styles
  >
  Resizable: Header<
    ResizableT.Kind,
    ResizableT.Slot,
    ResizableT.Variants,
    ResizableT.Classes,
    ResizableT.Styles
  >
  Select: Header<SelectT.Kind, SelectT.Slot, SelectT.Variants, SelectT.Classes, SelectT.Styles>
  Separator: Header<
    SeparatorT.Kind,
    SeparatorT.Slot,
    SeparatorT.Variants,
    SeparatorT.Classes,
    SeparatorT.Styles
  >
  Sheet: Header<SheetT.Kind, SheetT.Slot, SheetT.Variants, SheetT.Classes, SheetT.Styles>
  Sidebar: Header<
    SidebarT.Kind,
    SidebarT.Slot,
    SidebarT.Variants,
    SidebarT.Classes,
    SidebarT.Styles
  >
  Slider: Header<SliderT.Kind, SliderT.Slot, SliderT.Variants, SliderT.Classes, SliderT.Styles>
  Stepper: Header<
    StepperT.Kind,
    StepperT.Slot,
    StepperT.Variants,
    StepperT.Classes,
    StepperT.Styles
  >
  Switch: Header<SwitchT.Kind, SwitchT.Slot, SwitchT.Variants, SwitchT.Classes, SwitchT.Styles>
  Table: Header<TableT.Kind, TableT.Slot, TableT.Variants, TableT.Classes, TableT.Styles>
  Tabs: Header<TabsT.Kind, TabsT.Slot, TabsT.Variants, TabsT.Classes, TabsT.Styles>
  Textarea: Header<
    TextareaT.Kind,
    TextareaT.Slot,
    TextareaT.Variants,
    TextareaT.Classes,
    TextareaT.Styles
  >
  Tooltip: Header<
    TooltipT.Kind,
    TooltipT.Slot,
    TooltipT.Variants,
    TooltipT.Classes,
    TooltipT.Styles
  >
  Tree: Header<TreeT.Kind, TreeT.Slot, TreeT.Variants, TreeT.Classes, TreeT.Styles>
}

type IsNever<T> = [T] extends [never] ? true : false
type Assert<T extends true> = T

export type ListStyleContract = [
  Assert<'root' extends keyof ListT.Slot ? true : false>,
  Assert<IsNever<ListT.Variants>>,
]

export type SlotOwnershipContract = [
  Assert<'fallbackContent' extends keyof AvatarT.Slot ? true : false>,
  Assert<
    'image' | 'fallback' | 'fallbackContent' | 'badge' extends keyof AvatarGroupT.Slot
      ? true
      : false
  >,
  Assert<'control' | 'icon' | 'label' extends keyof CheckboxGroupT.Slot ? true : false>,
  Assert<'icon' extends keyof CheckboxT.Slot ? true : false>,
  Assert<'controlLabel' extends keyof PaginationT.Slot ? true : false>,
  Assert<'itemWrapper' | 'itemLabel' | 'itemIndicator' extends keyof SelectT.Slot ? true : false>,
]

;<Icon name="icon-search" classes={{ root: 'text-primary' }} styles={{ root: { color: 'red' } }} />
;<Icon name="icon-close" />
;<Icon name="icon-chevron-double-left" />
;<Icon name="icon-panel-open" />
;<Button leading="icon-plus">Add</Button>
;<Select items={[]} classes={{ itemLabel: 'font-semibold' }} />
// @ts-expect-error Style keys remain local to Select.
;<Select items={[]} classes={{ selectItemLabel: 'font-semibold' }} />
;<Icon name="i-lucide-search" />
;<Icon name="i-lucide:search" />
;<Icon name="app-brand-icon" />
;<Icon name="whatever-runtime-class" />
;<Icon name={<span />} />
const Glyph = () => <span />
;<Icon name={Glyph} />
;<Kbd value="K" classes={{ root: 'text-primary' }} styles={{ root: { color: 'red' } }} />

type ExpectedIconNames =
  | 'icon-arrow-down'
  | 'icon-arrow-left'
  | 'icon-arrow-right'
  | 'icon-arrow-up'
  | 'icon-chevron-double-left'
  | 'icon-chevron-double-right'
  | 'icon-copy-check'
  | 'icon-folder-open'
  | 'icon-panel-close'
  | 'icon-panel-open'
  | 'icon-search'
  | 'icon-loading'
  | 'icon-success'
  | 'icon-error'
  | 'icon-warning'
  | 'icon-info'
  | 'icon-close'

export type IconLiteralContract = Assert<
  IsNever<Exclude<ExpectedIconNames, Extract<IconT.Name, ExpectedIconNames>>>
>

const Schema = v.object({ name: v.string() })
const form = createForm({ schema: Schema })
;<form.Form classes={{ root: 'space-y-2' }} styles={{ root: { color: 'red' } }} />

const tree = createTree({
  items: () => [{ id: 'root', name: 'Root' }],
  getKey: (node: { id: string; name: string }) => node.id,
  getTextValue: (node: { id: string; name: string }) => node.name,
})
;<tree.Tree classes={{ root: 'w-full' }} styles={{ root: { color: 'red' } }} />

export type RetainedNamespaceMembers = [
  IconT.Name,
  KbdT.Key,
  AvatarT.Status,
  FieldT.Name,
  FileUploadT.Value,
  FormT.FieldName<typeof Schema>,
  FormT.Instance<typeof Schema>,
  TreeT.Instance<{ id: string; name: string }>,
  TreeT.ItemInstance<{ id: string; name: string }>,
  TreeT.ItemRenderProps<{ id: string; name: string }>,
  InputNumberT.PointerType,
  StepperT.Value,
  SelectT.Entry,
  ComboboxT.Row,
  MultiSelectT.TagRenderProps,
  SidebarT.Context,
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
  SidebarT.PanelBase,
  SidebarT.PanelProps,
  SidebarT.HeaderBase,
  SidebarT.HeaderProps,
  SidebarT.ContentBase,
  SidebarT.ContentProps,
  SidebarT.FooterBase,
  SidebarT.FooterProps,
  SidebarT.InsetBase,
  SidebarT.InsetProps,
  SidebarT.TriggerBase,
  SidebarT.TriggerProps,
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
  TreeT.ItemBase,
  TreeT.ItemProps,
  TreeT.ItemTriggerBase,
  TreeT.ItemTriggerProps,
  TreeT.ItemIconBase,
  TreeT.ItemIconProps,
  TreeT.ItemLabelBase,
  TreeT.ItemLabelProps,
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
  TableT.HeaderProps,
  TableT.BodyProps,
  TableT.FooterProps,
  TableT.RowBase,
  TableT.RowProps,
  TableT.HeadBase,
  TableT.HeadProps,
  TableT.CellBase,
  TableT.CellProps,
  TableT.CaptionProps,
]

# Current

- [ ] slider value should infer from value property and become generic
- [ ] remove button's icon-* size variants, create a <IconButtonInner> component with size variants for internal use without loading logic, expose <IconButton> with loading logic (using <IconButtonInner> inside)
- [ ] finish remaining `@kobalte/core` extraction
  - [ ] overlay slice: create Moraine-owned shared overlay primitives and state helpers
    - [ ] add a shared overlay root/presence layer to centralize controlled/uncontrolled open state, trigger wiring, portal mounting, escape handling, outside-click handling, and scroll locking
    - [ ] add shared positioning helpers for anchored content so `Popover`, `Tooltip`, and menu surfaces stop depending on Kobalte popper behavior
    - [ ] add shared focus-management rules for modal vs non-modal overlays, initial focus, restore focus, and nested overlay coordination
    - [ ] define shared overlay types/events so `dismissible`, `onClosePrevent`, placement, and content lifecycle props are owned by Moraine instead of Kobalte types
  - [ ] overlay slice: migrate dialog family
    - [ ] refactor `src/overlays/popup/popup.tsx` to use Moraine-owned overlay root, trigger, overlay, portal, and content semantics
    - [ ] refactor `src/overlays/dialog/dialog.tsx` to remove `KobalteDialog.Title`, `Description`, and `CloseButton` usage while preserving header/body/footer slot behavior
    - [ ] refactor `src/overlays/sheet/sheet.tsx` to reuse the same popup/dialog foundation with side-based transitions and dismiss-prevention logic
    - [ ] verify `Dialog`, `Popup`, and `Sheet` tests still cover controlled/uncontrolled open state, overlay rendering, dismiss prevention, focus behavior, and slot class/style overrides
  - [ ] overlay slice: migrate menu family
    - [ ] replace `src/overlays/shared-overlay-menu/menu.tsx` Kobalte item primitives with Moraine-owned menu tree rendering for items, groups, separators, checkbox items, submenus, indicators, and portals
    - [ ] define a shared menu state model for highlighted item, nested submenu open state, keyboard navigation, pointer intent, and text value lookup
    - [ ] refactor `src/overlays/dropdown-menu/dropdown-menu.tsx` to use the shared menu model with anchored trigger/content behavior
    - [ ] refactor `src/overlays/context-menu/context-menu.tsx` to reuse the same menu model with contextmenu/open-at-pointer behavior
    - [ ] preserve current submenu affordances, checkbox item semantics, keyboard shortcuts display, and top/bottom content slots
    - [ ] keep the existing “pointer moves toward submenu closes too early” todo in scope for the Moraine-owned submenu intent logic
  - [ ] overlay slice: migrate popover and tooltip
    - [ ] refactor `src/overlays/popover/popover.tsx` to use Moraine-owned anchored overlay primitives and placement state
    - [ ] refactor `src/overlays/tooltip/tooltip.tsx` to use Moraine-owned hover/focus/open-delay behavior and anchored positioning
    - [ ] make sure tooltip/popover share the same placement API, arrow behavior if applicable, outside interaction handling, and portal strategy
  - [ ] select/combobox slice: create Moraine-owned combobox core
    - [ ] define a shared combobox context/store that replaces `useComboboxContext` and owns open state, highlighted key, selected keys, input value, filtered collection, and list navigation
    - [ ] replace the Kobalte collection model with Moraine-owned normalized item/group structures and traversal helpers
    - [ ] move filtering, lookup, selection, and list-state behavior in `src/forms/select/shared/behavior.ts` behind Moraine-owned interfaces instead of `ComboboxContextValue`
    - [ ] define shared DOM/id contracts for control, input, trigger, content, listbox, option, group, and hidden form value synchronization
  - [ ] select/combobox slice: migrate select rendering
    - [ ] refactor `src/forms/select/shared/render.tsx` to replace `Combobox.Control`, `Input`, `Trigger`, `Content`, `Listbox`, `Item`, `Section`, `ItemLabel`, `ItemDescription`, `ItemIndicator`, `Portal`, and `HiddenSelect`
    - [ ] preserve current slot names, custom `optionRender`/`labelRender`, empty state rendering, infinite scroll callback, grouped options, and clear/trigger button behavior
    - [ ] remove Kobalte-specific sizing/layout tokens such as `max-h-$kb-popper-content-available-height` or replace them with Moraine-owned equivalents
  - [ ] select/combobox slice: migrate `Select` and `MultiSelect`
    - [ ] refactor `src/forms/select/select.tsx` to use the Moraine-owned combobox store for single selection, searchable input, form integration, and clear behavior
    - [ ] refactor `src/forms/select/multi-select.tsx` to use the same combobox store for multi-selection, tag rendering, keyboard deletion, and controlled/uncontrolled value handling
    - [ ] preserve `openOnClick`, `filterOption`, `allowClear`, `onScrollBottom`, loading/trigger icons, grouped options, and form-field integration
    - [ ] make sure single-select and multi-select share the same collection/filter pipeline but own only their value semantics
  - [ ] select/combobox slice: migrate `CommandPalette`
    - [ ] refactor `src/navigation/command-palette/command-palette.tsx` to use the Moraine-owned combobox/listbox infrastructure instead of `@kobalte/core/combobox`
    - [ ] preserve nested navigation, back behavior, controlled search term, empty state, loading state, keyboard shortcuts display, and autofocus rules
    - [ ] keep command-palette item/group rendering aligned with the shared overlay/listbox primitives to avoid a third independent collection implementation
  - [ ] final `@kobalte/core` removal: migrate leftover non-overlay/non-combobox primitives
    - [ ] refactor `src/elements/progress/progress.tsx`
    - [ ] refactor `src/elements/collapsible/collapsible.tsx`
    - [ ] refactor `src/forms/checkbox/checkbox.tsx`
    - [ ] refactor `src/forms/switch/switch.tsx`
    - [ ] refactor `src/forms/radio-group/radio-group.tsx`
    - [ ] refactor `src/forms/slider/slider.tsx`
    - [ ] refactor `src/forms/input-number/input-number.tsx`
    - [ ] refactor `src/forms/file-upload/file-upload.tsx`, including replacing exported file-field types with Moraine-owned public types
  - [ ] final `@kobalte/core` removal: clean package/types/docs
    - [ ] remove all remaining `@kobalte/core` imports from `src/`
    - [ ] replace remaining Kobalte-derived public prop/type aliases with Moraine-owned types in `src/shared/types.ts` or feature-local namespaces
    - [ ] remove `@kobalte/core` from `/home/runner/work/moraine/moraine/package.json`
    - [ ] update any docs, tests, and api-doc expectations that still mention Kobalte implementation details where Moraine now owns the behavior
  - [ ] final validation for the full extraction
    - [ ] run targeted tests after each migrated family
    - [ ] run `bun run typecheck`
    - [ ] run `bun run test --run`
    - [ ] run `bun run qa` once the runner/config issue for `oxlint.config.ts` is resolved in the environment

# V1

- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table
- [ ] llm.txt

# Maybe Future

- [ ] inline/fork external libs
  - [ ] When the pointer moves from that parent item toward the submenu, the submenu closes too early before the pointer can reach it, because a different sibling menu item becomes highlighted/triggered during the pointer movement.
  - [ ] Collapsible component 's content height has not transition
  - [ ] When slider thumb overlapped, should allow to slide to any direction
  - [ ] No keyboard loop option in tab

# Changelog

## 1.0.0

First stable release. The public API follows semantic versioning from here on. This section lists
every breaking change since `0.9.0`.

### Optional peers

- `moraine/data-table` now wraps `@tanstack/table-core` directly. Replace the `@tanstack/solid-table`
  peer with `@tanstack/table-core`, and import `createTable`, `FlexRender`, and `flexRender` from
  `moraine/data-table`. Table instances no longer carry `Subscribe` or `FlexRender`.
- `moraine/dnd` now wraps `@dnd-kit/dom` directly. Replace the `@dnd-kit/solid` peer with
  `@dnd-kit/dom`.
- Peer ranges: `@tanstack/virtual-core` is `^3.19.11`, `@dnd-kit/dom` is `^0.5.3`, and
  `@iconify/tailwind` is `^1.2.0`.

### Components

- **Tabs, Stepper, Accordion:** item `content` accepts `JSX.Element | Component<ContentRenderProps>`.
  Tabs and Stepper items now require `value`. Accordion gains `headingLevel`.
- **CommandPalette:**
  - `disableFilter` is removed.
  - `filterItems` output is authoritative: the returned groups and items are rendered in the order
    returned, and may contain items that are not in `groups`.
- **NumberInput:**
  - `holdRepeat`, `repeatDelayMs`, `repeatIntervalMs`, `repeatThrottleMs`, and `repeatPointerTypes`
    are removed. Use `repeat={false}` or `repeat={{ delay, interval, throttle, pointerTypes }}`.
  - The hidden input serializes the canonical value.
- **PinInput:** `onChange` is removed. Use `onValueChange`, which receives `string[]`.
- **FileUpload:** `fileRender` is removed. Use `itemRender`.
- **List:** `fallback` is renamed to `emptyRender`.
- **Sidebar:** `width` is a number of pixels instead of a CSS length string. Use the global
  `--sidebar-width` for CSS lengths. `Sidebar.Rail` resizes the desktop panel.
- **Resizable:**
  - `value` and `defaultValue` are `Record<panelId, percent>`, and `onValueChange` emits that record.
  - `onValueCommit` replaces `onResizeStart`, `onResizeEnd`, and `onHandleKeyDown`.
  - Panel `min`, `max`, `collapsedSize`, and `keyboardDelta` are percent numbers. `collapsibleMin` is
    renamed to `collapsedSize`.
  - `Handle` drops `action` and its inner button. Enter on a handle toggles the nearest collapsible
    panel.
  - The `handleControl` slot is replaced by `grip`.
  - `data-resizable-root` and the intersection target attributes are renamed to `data-splitter-*`.
  - The `translations` prop is removed.

### Fixes

- Submenu triggers keep their own submenu open when they receive focus.
- Resizable handles reverse their arrow keys and drag direction in right-to-left layouts.
- `moraine/data-table` disposes its reactive subscriptions when the owner of `createTable` is disposed.
- Toast swipe cancellation no longer dismisses the toast, a deduplicated toast bumps once, and a
  bump no longer restarts the timer of a removed toast.

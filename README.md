# Rock UI

Opinioned component library for solid.js, with style/base component sourcing from `zaidan/` (Kobalte-powered primitives)

## Breaking Changes

### 2026-03-11

- Style prefix changed from `_RK-` to `rk-`.
- `rock-ui` now ships a Tailwind v3 prebuilt stylesheet at `rock-ui/tw3.css`.
- Root export now includes style presets:
  - `unocssPreset`
  - `tailwind4Preset`

### 2026-03-12

- Tailwind v4 no longer requires `rock-ui/semantic.css`; semantic utilities are now built into `tailwind4Preset()`.
- `rock-ui/semantic.css` export has been removed (breaking).

### 2026-03-02

- `Input` has removed `icon`, `leadingIcon`, and `trailingIcon` props.
- `Input` now uses `leading` and `trailing` as the only adornment slots, rendered via `Icon`.
- `Input` no longer exposes icon child slots (`leadingIcon` / `trailingIcon`) for `classes` overrides or runtime `data-slot` output.
- Migration:
  - `<Input icon="i-lucide-search" />` -> `<Input leading="i-lucide-search" />`
  - `<Input trailing icon="i-lucide-search" />` -> `<Input trailing="i-lucide-search" />`
  - `<Input leadingIcon="a" trailingIcon="b" />` -> `<Input leading="a" trailing="b" />`

### 2026-02-23

- `Input` and `Textarea` no longer support the polymorphic `as` prop and always render a `<div>` root wrapper.
- `Progress` no longer supports the `inverted` prop.
- `Kbd` now supports `variant` values `default`, `outline`, and `invert`; default variant is `outline`.

### 2026-02-22

- Overlay `arrow` support has been hard-removed from public APIs and runtime rendering paths (`Popover`, `Tooltip`, `DropdownMenu`, `ContextMenu`, and shared overlay menu contracts).
- Kobalte-backed components now type exported props as `RockBaseProps + Omit<KobalteRootProps, ...>` and no longer extend `JSX.*HTMLAttributes` directly.
- Components without a direct Kobalte root primitive (`Card`, `CheckboxGroup`, `FieldGroup`, `Form`, `FormField`, `Icon`, `Kbd`) no longer accept generic HTML passthrough props; only explicit Rock props are supported.
- `Input` and `Textarea` now use Kobalte `TextFieldRootProps`-based typing plus explicit Rock props, instead of direct `JSX.InputHTMLAttributes` / `JSX.TextareaHTMLAttributes` extension.
- Where slot-style APIs are used, `class` passthrough remains intentionally unsupported in favor of `classes.*` overrides.

## Styling Engines

```ts
import { unocssPreset, tailwind4Preset } from 'rock-ui'
```

- UnoCSS: use `unocssPreset` in your Uno config presets.
- Tailwind v4: merge `tailwind4Preset()` into your Tailwind config.

- Tailwind v3: import prebuilt CSS manually:

```css
@import 'rock-ui/tw3.css';
```

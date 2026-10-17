---
name: Variant x Tone colors
overview: Rebuild Moraine's color derivation system around three layers. Palette roles split into surfaces (background, card, popover, muted, accent) and tones (primary, secondary, neutral, danger, info, success, warning). In light mode, default foregrounds reuse `--background` (var(--background)) rather than pure white, with status tone base colors calibrated to guarantee WCAG 2.2 AA (>= 4.5:1) against `--background`. The internal tone channel is strictly separated from public theme configuration. Top-level mix knobs are properly wired through resolveThemes and merged per theme with strict input validation (0-100 number or CSS string). Button and Badge become variant x tone with zero compounds — every tone uses the same generic tone-channel formulas. Secondary is confirmed as a slate brand tone; breaking changes and migration mapping live strictly in commit messages (not in public docs). Legacy duplicate alpha fallbacks in Wind3 are intentionally removed with documented degradation. ButtonGroup / ToggleButton / Pagination / FeedbackAction forward tone, tone props are split out to avoid DOM pollution, the per-role --mo-auto-* matrix is replaced, and consumers plus tests are updated.
todos:
  - id: tokens
    content: 'tokens.ts: split roles into surfaces (5) and tones (7, including secondary), reuse var(--background) as status tone foreground fallback, separate public theme roles from the internal tone channel, export Tone and TONES, add single-source TONE_VARS, replace createStateColorDeclarations with zero-arg gated declarations using var(--mo-mix-*) fallbacks'
    status: pending
  - id: presets
    content: 'unocss.ts / tailwind.ts / defaults.ts: calibrate light status tone bases in DEFAULT_THEME_COLORS to meet WCAG 2.2 AA (>= 4.5:1) against --background (reusing var(--background) rather than pure white), set dark status tone defaults meeting WCAG AA, exclude tone from MoraineThemeColors and createThemeCSS, add validated mix knobs (0-100 number or CSS string), wire shared.mix in resolveThemes, shallow-merge mix in mergeTheme, drop numeric/callback resolvers, add neutral and tone to wind3 regex, intentionally remove legacy duplicate /alpha fallback and document degradation'
    status: pending
  - id: button
    content: 'Button: variant solid|soft|outline|ghost|link x tone (default solid + primary); all tones including neutral use the same generic tone-channel formulas (no compounds); link with border-transparent, focus ring tone/20 with dark:40; add tone to splitProps; update container contrast guidelines (prefer solid on colored containers)'
    status: pending
  - id: badge
    content: 'Badge: variant solid|soft|surface|outline x tone (default soft + neutral); all tones including neutral use the same base variant classes (no compounds); add tone to splitProps'
    status: pending
  - id: forwarders
    content: 'ButtonGroup / ToggleButton / Pagination / FeedbackAction / Toast / AlertDialog: forward tone, add tone/activeTone to ToggleButton splitProps, and migrate variant values; migrate input-number and docs-a primary-hover usages'
    status: pending
  - id: consumers
    content: 'Menu danger item, Field error, required asterisks, and select duplicate tag: switch to ink tokens; migrate docs, demos and type fixtures'
    status: pending
  - id: docs
    content: Rewrite the color sections of unocss.mdx / design.mdx / customization.mdx and docs/shared/color-tokens.ts, documenting Variant x Tone, confirmed slate secondary, mix knobs, and intentional color-mix degradation (migration details live strictly in commit messages, not in public docs)
    status: pending
  - id: tests
    content: Add WCAG 2.2 AA automated contrast tests (light & dark x 7 tones x solid against --background), tone channel isolation tests, mix validation tests (range check, CSS strings, resolveThemes shared inheritance, override precedence), update token/preset/component tests, then run pnpm run qa and pnpm run test
    status: pending
isProject: false
---

# Variant x Tone and a rebuilt color derivation system

## Problems with the current system

- `--mo-auto-X-{hover,active}` is a fixed matrix: 11 roles x 2 states = 22 custom properties declared on every element (`*, ::before, ::after`). Adding tint, border and text derivations on the same model would push that past 60.
- Tones (danger and the other status colors) and surfaces (accent, muted and so on) use the same state model, although their use cases differ completely.
- The configuration surface is heavy. Per-role states accept a string, a number or a callback, and there is also `colorStates` plus a separate `@supports` block for numeric overrides.
- Tinted backgrounds and borders are already written ad hoc as alpha modifiers (`bg-danger/15`, `ring-danger/20`), outside the token system.

## New model: three layers

```mermaid
flowchart TB
  subgraph palette [Palette, authored per theme]
    Surfaces["surfaces: background card popover muted accent"]
    Tones["tones: primary secondary neutral danger info success warning"]
    Lines["lines: border input ring, plus control backdrop"]
  end
  subgraph rules [Derivation rules, gated by @supports]
    StateRule["state: mix toward on-color by --mo-mix-hover / --mo-mix-active"]
    InkRule["ink: mix toward --foreground by --mo-mix-ink"]
    AlphaRule["wash and edge: alpha modifiers such as /12 and /40"]
  end
  subgraph channel [Tone channel, per component]
    ToneVars["--mo-tone, --mo-tone-foreground, --mo-tone-ink"]
  end
  Surfaces --> StateRule
  Tones --> InkRule
  Tones -->|"recipe tone variant"| ToneVars
  ToneVars --> StateRule
  ToneVars --> AlphaRule
```

Core rules:

- **Brand tones vs built-in tones (consumers generally author `primary`, `secondary`, and `accent`):**
  - **Brand / Theme tones (`primary`, `secondary`)**: Primary is the central brand/accent color; secondary is the secondary brand/support tone. In `DEFAULT_THEME_COLORS`, primary stays `rgb(23, 23, 23)` / `rgb(250, 250, 250)` light, `rgb(229, 229, 229)` / `rgb(23, 23, 23)` dark; secondary is a brand anchor like primary — a dark, high-contrast color in light mode (light in dark mode), just a different hue — so the generic alpha wash (`/12`), edge (`/40`) and ink formulas produce visible results. Today's `rgb(245, 245, 245)` secondary is a surface value and would wash out, so it is replaced. `<Button variant="solid" tone="secondary">` produces a dark slate brand-support fill (not the old light-gray secondary fill).
  - **Confirmed secondary defaults (slate brand anchor):** restrained low-chroma slate.
    - light: `secondary: { base: 'rgb(51, 65, 85)', foreground: 'rgb(248, 250, 252)' }` (slate-700 / slate-50)
    - dark: `secondary: { base: 'rgb(203, 213, 225)', foreground: 'rgb(15, 23, 42)' }` (slate-300 / slate-900)
    - Computed (sRGB approximation of the mixes; WCAG contrast):
      - light on white: solid fg/base 9.9:1; `bg-tone/12` ≈ `rgb(231, 232, 235)` (visible cool-gray wash, 1.23:1 vs white, same strength as neutral /12); `border-tone/40` ≈ `rgb(173, 179, 187)` (2.1:1, crisp edge); ink (25% toward `--foreground` `rgb(10,10,10)`) ≈ `rgb(41, 51, 66)` — 12.7:1 on white, 10.4:1 on the /12 wash.
      - dark on `rgb(10, 10, 10)`: solid fg/base 12.0:1; `bg-tone/12` ≈ `rgb(33, 34, 36)` (1.25:1, visible); `border-tone/40` ≈ `rgb(87, 91, 96)` (2.9:1); ink (25% toward `rgb(250,250,250)`) ≈ `rgb(215, 222, 231)` — 14.6:1 on background, 11.7:1 on the /12 wash.
  - **Built-in tones (`neutral`, `danger`, `info`, `success`, `warning`)**: Moraine supplies complete built-in defaults in `DEFAULT_THEME_COLORS`. `neutral` is Moraine's built-in monochrome/black-and-white tone (used out-of-the-box by neutral controls, default soft badge, outline/ghost buttons, pagination). Status tones (`danger`, `info`, `success`, `warning`) provide built-in feedback colors. Users rarely need to touch built-in tones, but may override them if needed.
  - Together with the surface role `accent`, users generally only need to define **`primary`**, **`secondary`**, and **`accent`** to theme an entire Moraine application.
  - All 7 tones are equal first-class citizens in the tone channel, sharing the exact same generic formulas (`--mo-tone`, `--mo-tone-foreground`, `--mo-tone-ink`) with zero special-cased class lists.

- **Tone Foregrounds & WCAG 2.2 AA Contrast Guarantee:**
  - **Light mode foregrounds reuse `--background` (`var(--background)`):** Do not hardcode pure white (`rgb(255, 255, 255)`) as the default foreground for light mode. Reusing `var(--background)` ensures text color harmonizes with custom background tints (such as off-white, paper, or tinted surfaces), avoiding harsh and clashing `#ffffff` text.
  - **Light mode status tone base calibration:** Because light mode foreground reuses `--background` (default `rgb(255, 255, 255)`), status tone base defaults are calibrated to guarantee WCAG 2.2 AA ($\ge 4.5:1$ for normal text) against `--background`:
    - `danger.base`: `rgb(220, 38, 38)` (`#dc2626`, Tailwind red-600) $\to$ contrast vs `--background` is **4.83:1** (Pass)
    - `info.base`: `rgb(8, 109, 221)` (`#086ddd`) $\to$ contrast vs `--background` is **4.95:1** (Pass)
    - `success.base`: `rgb(21, 128, 61)` (`#15803d`, Tailwind green-700) $\to$ contrast vs `--background` is **5.02:1** (Pass)
    - `warning.base`: `rgb(180, 83, 9)` (`#b45309`, Tailwind amber-700) $\to$ contrast vs `--background` is **5.02:1** (Pass)
  - All built-in tone defaults are calibrated and tested to guarantee WCAG 2.2 AA compliance for `<Button variant="solid" tone="{tone}">`:

| Tone        | Theme | Base                 | Foreground           | Contrast | WCAG 2.2 AA ($\ge 4.5:1$) |
| :---------- | :---- | :------------------- | :------------------- | :------- | :------------------------ |
| `primary`   | Light | `rgb(23, 23, 23)`    | `rgb(250, 250, 250)` | 18.2:1   | Pass                      |
| `primary`   | Dark  | `rgb(229, 229, 229)` | `rgb(23, 23, 23)`    | 13.9:1   | Pass                      |
| `secondary` | Light | `rgb(51, 65, 85)`    | `rgb(248, 250, 252)` | 9.9:1    | Pass                      |
| `secondary` | Dark  | `rgb(203, 213, 225)` | `rgb(15, 23, 42)`    | 12.0:1   | Pass                      |
| `neutral`   | Light | `rgb(23, 23, 23)`    | `var(--background)`  | 18.7:1   | Pass                      |
| `neutral`   | Dark  | `rgb(250, 250, 250)` | `rgb(23, 23, 23)`    | 18.2:1   | Pass                      |
| `danger`    | Light | `rgb(220, 38, 38)`   | `var(--background)`  | 4.83:1   | Pass                      |
| `danger`    | Dark  | `rgb(248, 113, 113)` | `rgb(23, 23, 23)`    | 6.48:1   | Pass                      |
| `info`      | Light | `rgb(8, 109, 221)`   | `var(--background)`  | 4.95:1   | Pass                      |
| `info`      | Dark  | `rgb(96, 165, 250)`  | `rgb(23, 23, 23)`    | 7.05:1   | Pass                      |
| `success`   | Light | `rgb(21, 128, 61)`   | `var(--background)`  | 5.02:1   | Pass                      |
| `success`   | Dark  | `rgb(74, 222, 128)`  | `rgb(23, 23, 23)`    | 10.29:1  | Pass                      |
| `warning`   | Light | `rgb(180, 83, 9)`    | `var(--background)`  | 5.02:1   | Pass                      |
| `warning`   | Dark  | `rgb(251, 191, 36)`  | `rgb(23, 23, 23)`    | 10.74:1  | Pass                      |

_(Note on Dark Mode status tones: using the vibrant 400 scale with dark foreground `rgb(23, 23, 23)` achieves high contrast (6.5:1 to 10.7:1), matching the dark-mode behavior of `primary`, `secondary`, and `neutral` where solid buttons feature a light fill and dark text.)_

- **Tones are high-contrast anchors; Surfaces are pre-tinted backgrounds.**
  - A _Surface_ (like `muted: rgb(245, 245, 245)`) is an opaque, low-contrast background fill.
  - A _Tone_ in an alpha-tinting system (Radix / Nuxt UI) is the full-contrast color anchor whose alpha washes (`/12`, `/40`) generate visible surfaces, borders, and readable text. If `neutral.base` were set to `#f5f5f5`, `bg-tone/12` on white would be `#fefefe` (invisible), `border-tone/40` would be `#fbfbfb` (invisible), and `text-tone-ink` would mix into `#bbbbbb` (1.45:1 contrast, failing WCAG AA).
  - Therefore, the built-in `neutral` tone in `DEFAULT_THEME_COLORS` uses high-contrast anchor defaults matching the monochrome primary scale:
    - light: `neutral: { base: 'rgb(23, 23, 23)', foreground: 'rgb(250, 250, 250)' }`
      - `bg-tone/12` on white yields `~#e3e3e3` (a visible soft gray wash).
      - `border-tone/40` on white yields `~#a2a2a2` (a crisp outline border).
      - `hover:bg-tone/10` yields `~#e8e8e8` (a visible ghost hover wash).
      - `text-tone-ink` yields dark text with $> 10:1$ contrast.
    - dark: `neutral: { base: 'rgb(250, 250, 250)', foreground: 'rgb(23, 23, 23)' }`
      - `bg-tone/12` on the dark background yields `10 + 0.12 × 240 = rgb(38.8, 38.8, 38.8)` — matching today's dark secondary surface (`rgb(38, 38, 38)`).
  - Default `soft + neutral` badges (`/12` ≈ `#e3e3e3` on white) are darker than the old accent-filled badge (`#f5f5f5`).
  - Surfaces are `background`, `card`, `popover`, `muted`, `accent`. All 5 surfaces remain unchanged in `DEFAULT_THEME_COLORS` for static opaque background uses.
- **Identity is per role, states are generic.** Each role only authors `base` and `foreground`. Tones may also author an `ink`.
- **There are only three derivation rules.**
  - state (hover/active): mix toward the role's on-color.
  - ink: readable text on a neutral surface, made by mixing toward `--foreground`.
  - alpha: wash and edge colors come from alpha modifiers (`bg-tone/12`, `border-tone/40`), with no new token names. Transparent tints are intentional (as in Radix / Nuxt UI / Park UI): one token works on any neutral surface.
- **Mix amounts are CSS-variable knobs with clear input contracts:** `--mo-mix-hover` (default 8%), `--mo-mix-active` (12%) and `--mo-mix-ink` (25%). Defaults come from `var()` fallbacks inside the formulas, so nothing needs to be emitted by default. Any theme selector or subtree can tune them, for example raising ink in `.dark`.
- **Tone channel:** the component writes 3 variables inline through recipe style keys. The tone's hover/active are derived generically on `*` from `--mo-tone`, so per-tone state tokens are no longer needed. The internal `tone` channel is strictly excluded from public theme configuration.

## Token details: [src/theme/tokens.ts](src/theme/tokens.ts)

Canonical tone list and tone type:

```ts
export const TONES = [
  'primary',
  'secondary',
  'neutral',
  'danger',
  'info',
  'success',
  'warning',
] as const
export type Tone = (typeof TONES)[number]
```

Surfaces (`background`, `card`, `popover`, `muted`, `accent`): `DEFAULT`, `foreground`, `hover`, `active`. Utility values keep the explicit-then-derived-then-base chain. The private derived variable is renamed `--mo-X-hover`:

```ts
hover: 'var(--accent-hover, var(--mo-accent-hover, var(--accent)))'
```

Tones (`primary`, `secondary`, `neutral`, `danger`, `info`, `success`, `warning`): `DEFAULT`, `foreground`, `ink`. **`-hover` / `-active` are removed.**

```ts
secondary: {
  DEFAULT: 'var(--secondary)',
  foreground: 'var(--secondary-foreground)',
  ink: 'var(--secondary-ink, var(--mo-secondary-ink, var(--secondary)))',
},
neutral: {
  DEFAULT: 'var(--neutral)',
  foreground: 'var(--neutral-foreground, var(--background))',
  ink: 'var(--neutral-ink, var(--mo-neutral-ink, var(--neutral)))',
},
danger: {
  DEFAULT: 'var(--danger)',
  foreground: 'var(--danger-foreground, var(--background))',
  ink: 'var(--danger-ink, var(--mo-danger-ink, var(--danger)))',
},
info: {
  DEFAULT: 'var(--info)',
  foreground: 'var(--info-foreground, var(--background))',
  ink: 'var(--info-ink, var(--mo-info-ink, var(--info)))',
},
success: {
  DEFAULT: 'var(--success)',
  foreground: 'var(--success-foreground, var(--background))',
  ink: 'var(--success-ink, var(--mo-success-ink, var(--success)))',
},
warning: {
  DEFAULT: 'var(--warning)',
  foreground: 'var(--warning-foreground, var(--background))',
  ink: 'var(--warning-ink, var(--mo-warning-ink, var(--warning)))',
},
```

Notice that status tones and neutral in `tokens.ts` retain `var(--background)` in their foreground fallback chain. When users or default light themes don't supply an explicit `--<tone>-foreground`, foreground dynamically adopts `var(--background)` rather than hardcoding pure white.

### Tone channel vs Public theme color schema

The `tone` entry in `MORAINE_COLORS` powers component utility classes (`bg-tone`, `text-tone-foreground`, `text-tone-ink`, `border-tone/40`):

```ts
tone: {
  DEFAULT: 'var(--mo-tone)',
  foreground: 'var(--mo-tone-foreground)',
  hover: 'var(--mo-tone-hover, var(--mo-tone))',
  active: 'var(--mo-tone-active, var(--mo-tone-hover, var(--mo-tone)))',
  ink: 'var(--mo-tone-ink)',
}
```

To prevent leaking the internal `tone` channel into public theme configuration:

1. **Theme color roles are explicitly defined:**
   ```ts
   export const THEME_COLOR_ROLES = [
     'background',
     'foreground',
     'primary',
     'secondary',
     'neutral',
     'card',
     'popover',
     'muted',
     'accent',
     'danger',
     'info',
     'success',
     'warning',
     'border',
     'input',
     'control',
     'backdrop',
     'ring',
   ] as const
   export type MoraineThemeColorRole = (typeof THEME_COLOR_ROLES)[number]
   ```
2. **`MoraineThemeColors` strictly excludes `tone`:**
   ```ts
   export type MoraineThemeColors = {
     [Name in MoraineThemeColorRole]?: MoraineColorEntry<MoraineColorMap[Name]>
   }
   ```
   Users cannot configure `tone` in `presetMoraine({ colors: { tone: ... } })` or theme overrides (`override: { light: { colors: { tone: ... } } }`).
3. **Theme CSS generation iterates over `THEME_COLOR_ROLES` only:** `createThemeCSS` ignores `tone`, ensuring `--tone` is never emitted into stylesheet root selectors.
4. **Tailwind preset** (`src/theme/tailwind.ts`) maps `MORAINE_COLORS` (including `tone`) for utility class resolution while keeping `tone` excluded from user theme customization types.

`TONE_VARS` holds the recipe style keys, derived directly from `MORAINE_COLORS` as a single source of truth without duplicated strings:

```ts
export const TONE_VARS: Record<Tone, Partial<Record<`--${string}`, string>>> = Object.fromEntries(
  TONES.map((tone) => [
    tone,
    {
      '--mo-tone': MORAINE_COLORS[tone].DEFAULT,
      '--mo-tone-foreground': MORAINE_COLORS[tone].foreground,
      '--mo-tone-ink': MORAINE_COLORS[tone].ink,
    },
  ]),
) as Record<Tone, Partial<Record<`--${string}`, string>>>
```

Declarations gated by `@supports (color: color-mix(in oklch, red, white))` on `*, ::before, ::after`. A zero-arg `createGatedColorDeclarations()` replaces `createStateColorDeclarations`:

- Surface states: 5 x 2 = 10, each `color-mix(in oklch, var(--X), <on-color> var(--mo-mix-hover, 8%))` and active `var(--mo-mix-active, 12%)`.
- Tone ink: 7, each `color-mix(in oklch, var(--X), var(--foreground) var(--mo-mix-ink, 25%))`.
- Tone channel states: 2, each `color-mix(in oklch, var(--mo-tone), var(--mo-tone-foreground) var(--mo-mix-hover, 8%))` and active `var(--mo-mix-active, 12%)`.
- 19 declarations in total, down from 22.

Why `--mo-tone-ink` references a role chain, while channel hover is derived on `*`:

- A `color-mix` value written inline can't degrade. On old browsers it becomes invalid at computed-value time and resolves to `unset`.
- So inline values may only contain fallback chains without `color-mix`, and every `color-mix` must stay in the gated `*` rule.
- Ink keeps per-role authoring because readability needs to be tuned per tone (warning and success on white). States don't.

## Browser compatibility and intentional removal of alpha fallback

This design makes an **intentional browser compatibility decision** to rely on native `color-mix()` for alpha tint utilities rather than emitting duplicate solid fallbacks:

- In `unocss.ts`, remove the legacy duplicate solid color emission in the `moraine-color-alpha` variant (the custom `body(entries)` hook around lines 458–466). UnoCSS will emit a single clean `color-mix()` declaration.
- Update `docs/pages/docs/(overview)/unocss.mdx` (around line 180) to remove the claim that Wind3 keeps an unmodified solid color fallback.
- **Degradation behavior on legacy browsers without `color-mix()` support:**
  - `soft` variant (`bg-tone/12`): alpha background is unsupported and falls back to transparent, visually resembling `ghost`.
  - `outline` variant (`border-tone/40`): border color falls back to `currentColor` (which carries the text ink color).
  - Text color: uses tone ink, which cleanly falls back to the base tone color via CSS `var()` fallback chains.
  - Surface and tone hover/active: fall back to the base color via CSS `var()` fallback chains.

## Preset configuration & input contracts (breaking)

[src/theme/unocss.ts](src/theme/unocss.ts) and [src/theme/defaults.ts](src/theme/defaults.ts):

- `DEFAULT_THEME_COLORS`:
  - Light mode: status tone bases calibrated to ensure WCAG 2.2 AA ($\ge 4.5:1$) against `--background`; foreground reuses `var(--background)`.
  - Dark mode: status tones use light/vibrant bases with dark text `rgb(23, 23, 23)` to guarantee contrast $\ge 4.5:1$.
- Theme authoring experience: consumers generally only need to define `primary`, `secondary`, and `accent` (and optionally surfaces such as `background` or `card`). Built-in tones (`neutral`, `danger`, `info`, `success`, `warning`) are fully provided by Moraine out-of-the-box.
- Surface entries: `string | { base?, foreground?, hover?, active? }`, where state values are CSS strings only.
- Tone entries: `string | { base?, foreground?, ink? }`.
- Remove `colorStates`, `MoraineColorStateValue` (numbers and callbacks), `MoraineColorStateResolverContext`, `DEFAULT_COLOR_STATES` and the separate numeric `@supports` block.

### Mix knobs and input contracts

Add `mix?: Partial<Record<'hover' | 'active' | 'ink', number | string>>` to `MorainePresetTheme` and `PresetMoraineOptions`.

Validation rules (`assertMixValue`):

- **Numbers:** Must be finite numbers between 0 and 100 (`Number.isFinite(n) && n >= 0 && n <= 100`). Formatted as `${n}%`. Numbers outside this range throw `RangeError('[preset-moraine] mix.<key> must be a finite number between 0 and 100.')`.
- **Strings:** Preserved as-is. Intended as an advanced escape hatch for custom CSS expressions (e.g. `'calc(var(--custom-mix) * 1%)'` or `'15%'`) that evaluate to a valid `<percentage>`. Non-string/non-number values throw `TypeError`.

Wiring and precedence:

- In `resolveThemes(options)`: `options.mix` is explicitly collected into `shared`:
  ```ts
  const shared: MorainePresetTheme = {
    radius: options.radius ?? '0.625rem',
    fontSize: options.fontSize ?? '1rem',
    spacing: options.spacing ?? '0.25rem',
    sidebarWidth: options.sidebarWidth,
    mix: options.mix,
  }
  ```
  This ensures top-level `presetMoraine({ mix: ... })` is applied to `:root` and `.dark` defaults.
- In `mergeTheme()`: shallow-merge `mix`: `mix: { ...base.mix, ...override?.mix }`.
- In `createThemeCSS()`: emit `--mo-mix-hover`, `--mo-mix-active`, `--mo-mix-ink` under each theme's selector if defined. Built-in formulas contain fallback defaults (`var(--mo-mix-hover, 8%)`, `var(--mo-mix-active, 12%)`, `var(--mo-mix-ink, 25%)`).
- In `unocss.ts`, wind3 regex:
  - Add both `neutral` and `tone` to group names: `(background|foreground|primary|neutral|secondary|card|popover|muted|accent|danger|info|success|warning|border|input|control|ring|tone)`.
  - Add `ink` to state suffixes: `(?:-(foreground|hover|active|ink))?`.

[src/theme/tailwind.ts](src/theme/tailwind.ts): `addBase` uses the zero-arg gated declarations. Knobs are set by the user in CSS.

## Breaking changes & migration guide (for commit message / PR, not in docs)

> [!NOTE]
> The migration guide below is solely for git commit messages (`BREAKING CHANGE:` footer) and the PR description. Do NOT add migration or legacy mapping sections to public documentation (`docs/`), which should describe only current state.

This refactor introduces breaking changes for users upgrading from Moraine pre-alpha:

### 1. `secondary` semantic shift (Surface $\to$ Brand Tone)

- **Previous behavior:** `secondary` was an opaque light-gray surface background (`rgb(245, 245, 245)` in light, `rgb(38, 38, 38)` in dark).
- **New behavior:** `secondary` is now an active brand anchor Tone (slate-700 in light, slate-300 in dark by default).
- **CSS utility migration:**
  - `bg-secondary` now produces a dark slate background in light mode (brand tone).
  - To achieve the previous light-gray neutral surface fill, use **`bg-muted`** or **`bg-accent`**.
  - `text-secondary-foreground` resolves to high-contrast foreground on secondary.

### 2. Button and Badge API migration

| Old Component Usage            | New Component Usage                         | Visual Result                                                  |
| :----------------------------- | :------------------------------------------ | :------------------------------------------------------------- |
| `<Button variant="default">`   | `<Button variant="solid" tone="primary">`   | High-contrast primary brand fill                               |
| `<Button variant="secondary">` | `<Button variant="soft" tone="neutral">`    | Light-gray neutral wash (~#e3e3e3) matching old secondary look |
| `<Button variant="outline">`   | `<Button variant="outline" tone="neutral">` | Crisp neutral border with transparent bg                       |
| `<Button variant="ghost">`     | `<Button variant="ghost" tone="neutral">`   | Transparent bg with neutral hover wash                         |
| `<Button variant="danger">`    | `<Button variant="solid" tone="danger">`    | Solid red danger button                                        |
| `<Badge variant="subtle">`     | `<Badge variant="soft" tone="neutral">`     | Soft neutral tint                                              |
| `<Badge variant="secondary">`  | `<Badge variant="soft" tone="neutral">`     | Soft neutral tint                                              |

### 3. Removed state tokens

- Per-role state utilities (`hover:bg-primary-hover`, `active:bg-danger-active`, etc.) and CSS variables (`--primary-hover`, `--danger-active`) are removed.
- Components use the internal `tone` channel (`hover:bg-tone-hover`, `active:bg-tone-active`).
- Custom templates use alpha utilities (`hover:bg-primary/90`) or tune `--mo-mix-hover` / `--mo-mix-active`.

## Components

### Button ([button.recipe.ts](src/element/button/button.recipe.ts), [button.style-types.ts](src/element/button/button.style-types.ts), [button.tsx](src/element/button/button.tsx))

- `variant`: `'solid' | 'soft' | 'outline' | 'ghost' | 'link'`
- `tone`: `Tone` (default `solid + primary`)
- `base.root`: replace `FOCUS_VISIBLE_CLASS` with `focus-visible:(outline-none ring-3 ring-tone/20 dark:ring-tone/40)`
- Variant classes (same formulas for every tone, including neutral — zero compounds):
  - `solid`: `bg-tone text-tone-foreground hover:bg-tone-hover active:bg-tone-active border-transparent`
  - `soft`: `bg-tone/12 text-tone-ink hover:bg-tone/18 active:bg-tone/24 border-transparent`
  - `outline`: `border-tone/40 text-tone-ink bg-transparent hover:bg-tone/8 active:bg-tone/12`
  - `ghost`: `border-transparent text-tone-ink hover:bg-tone/10 active:bg-tone/16`
  - `link`: `text-tone-ink underline-offset-4 hover:underline border-transparent`
- In `button.tsx`: add `'tone'` to `splitProps` so it is consumed by `useRecipe` and does not leak as an invalid HTML attribute on `<Dynamic ... {...rest}>`.

#### Button container guidelines

- On colored containers (e.g. inside an Alert, Callout, or colored banner):
  - **Prefer `solid`**: `solid` provides an opaque, self-contained background with guaranteed contrast against its own `--mo-tone-foreground`.
  - **`outline` is conditional**: `outline` has a transparent background (`bg-transparent text-tone-ink border-tone/40`). Because `--mo-tone-ink` is derived by mixing toward `--foreground` for standard neutral surfaces, its contrast against arbitrary colored backgrounds is not guaranteed. Only use `outline` when the text and border have been specifically verified to meet contrast requirements against that specific container background.
  - Transparent alpha tints (`soft`, `surface`, `ghost`, and `outline` hover) blend with colored container backgrounds and should generally be avoided on non-neutral containers.

### Badge ([badge.recipe.ts](src/element/badge/badge.recipe.ts), [badge.style-types.ts](src/element/badge/badge.style-types.ts), [badge.tsx](src/element/badge/badge.tsx))

- `variant`: `'solid' | 'soft' | 'surface' | 'outline'`
- `tone`: `Tone` (default `soft + neutral`)
- Variant classes (same formulas for every tone, including secondary and neutral — zero compounds):
  - `solid`: `bg-tone text-tone-foreground border-transparent shadow-surface`
  - `soft`: `bg-tone/12 text-tone-ink border-transparent`
  - `surface`: `bg-tone/12 text-tone-ink border-tone/30`
  - `outline`: `bg-transparent text-tone-ink border-tone/40`
- `subtle` is renamed `soft`. Default `soft + neutral` uses the same generic soft formula on the neutral color role — not via special-case classes.
- In `badge.tsx`: add `'tone'` to `splitProps` so `styleProps` includes it and it does not leak into `rest` spread on the DOM.

### Forwarding components

- **ButtonGroup** ([button-group.style-types.ts](src/element/button-group/button-group.style-types.ts), [button-group.recipe.ts](src/element/button-group/button-group.recipe.ts), [button-group-context.ts](src/element/button-group/button-group-context.ts), [button-group.tsx](src/element/button-group/button-group.tsx)):
  - Add `tone?: ButtonStyleVariant['tone']` to `ButtonGroupStyleVariant`.
  - Add `tone: {}` to `buttonGroupRecipe.variants`.
  - Add `readonly tone?: ButtonT.Variant['tone'] | null` to `ButtonGroupContextValue`.
  - Provide `get tone() { return variants.tone }` in `ButtonGroupProvider`.
- **FeedbackAction & FeedbackActionButton** ([feedback.types.ts](src/overlay/base/feedback/feedback.types.ts), [feedback-action.tsx](src/overlay/base/feedback/feedback-action.tsx)):
  - Add `tone?: ButtonT.Variant['tone']` to `FeedbackAction` and `FeedbackActionButton`.
  - Pass `tone={props.action?.tone ?? props.tone}` to `<Button>`.
- **ToggleButton** ([toggle-button.recipe.ts](src/element/toggle-button/toggle-button.recipe.ts), [toggle-button.types.ts](src/element/toggle-button/toggle-button.types.ts), [toggle-button.tsx](src/element/toggle-button/toggle-button.tsx)):
  - `variant` / `activeVariant` move to new values (default `ghost` / `soft`).
  - `tone` / `activeTone` added (default `neutral` / `neutral`).
  - In `toggle-button.tsx`: add `'tone'` and `'activeTone'` to `splitProps`.
  - Pass `tone={pressed() ? variants.activeTone : variants.tone}` to `<Button>`.
- **Pagination** ([pagination.recipe.ts](src/navigation/pagination/pagination.recipe.ts), [pagination.style-types.ts](src/navigation/pagination/pagination.style-types.ts), [pagination.tsx](src/navigation/pagination/pagination.tsx)):
  - `variant` / `activeVariant` / `controlVariant` (defaults `ghost` / `outline` / `ghost`).
  - Add `tone` variant (default `neutral`).
  - Forward `tone={variants.tone}` to both page item `<Button>`s and prev/next control `<Button>`s.
- **Toast item** ([toast-item.tsx](src/overlay/toast/toast-item.tsx)):
  - Cancel button: `variant="soft" tone="neutral"` (today `variant="secondary"` at `toast-item.tsx:608`; soft neutral keeps the light-gray look instead of becoming a dark slate solid).
  - Action button: `variant="solid" tone="primary"` (or forwards `action.tone`).
  - Close button: `variant="ghost" tone="neutral"`.
- **AlertDialog** ([alert-dialog-entry.tsx](src/overlay/alert-dialog/alert-dialog-entry.tsx)):
  - Cancel button: `variant="outline" tone="neutral"`.
  - Action button: `variant="solid" tone={options().danger ? 'danger' : 'primary'}`.

### Consumers & Text Roles

- Menu danger item ([menu.recipe.ts](src/overlay/base/menu/menu.recipe.ts)): `text-danger` becomes `text-danger-ink`. Keep `bg-danger/15`.
- Field error ([field.recipe.ts](src/form/field/field.recipe.ts)): becomes `text-danger-ink`.
- Required indicators ([field.recipe.ts](src/form/field/field.recipe.ts), [checkbox.recipe.ts](src/form/checkbox/checkbox.recipe.ts), [switch.recipe.ts](src/form/switch/switch.recipe.ts), [checkbox-group.recipe.ts](src/form/checkbox-group/checkbox-group.recipe.ts)): migrate `text-danger` to `text-danger-ink`.
- Select-field duplicate tag input ([select-field.recipe.ts](src/form/shared/select/select-field.recipe.ts)): `data-duplicate:text-danger` becomes `data-duplicate:text-danger-ink`.
- input-number control button `text-primary-hover/active`: becomes `hover:text-primary/80 active:text-primary/70`. The `docs-a` shortcut in `docs/unocss.config.ts` is handled the same way.
- Invalid rings in `recipe-common` (`ring-danger/20`) are unchanged.

#### Audit: removed tone state tokens and old `secondary` usages (rg, 2026-10-17)

Tone `-hover` / `-active` tokens (`primary|secondary|danger|info|success|warning`) and `--mo-auto-*` disappear; `secondary` stops being a surface. Every hit outside `plan.md`:

Source (must change):

- `src/element/button/button.recipe.ts:42,45,57` — old `default` / `secondary` / `danger` variant strings using `bg-*-hover` / `bg-*-active` → replaced by the generic tone-channel variants (`hover:bg-tone-hover active:bg-tone-active`).
- `src/form/input-number/input-number.recipe.ts:18` — `active:text-primary-active hover:text-primary-hover` → `hover:text-primary/80 active:text-primary/70`.
- `src/overlay/toast/toast-item.tsx:608` — `variant="secondary"` → `variant="soft" tone="neutral"`.
- `src/theme/unocss.ts:437` — alpha regex lists `secondary` and `-(foreground|hover|active)`; update per the wind3 regex section (add `neutral|tone`, `ink`). `src/theme/unocss.ts:74,238,241` — `colorStates` option → removed (replaced by `mix`).
- `docs/unocss.config.ts:20` — `docs-a` `hover:text-primary-hover` → `hover:text-primary/80`.

Docs demos (`variant="secondary"` → `variant="soft" tone="neutral"`), 21 hits:

- `docs/pages/components/(general)/button-group/separator.tsx:6,8`; `(general)/card/header-action.tsx:10`; `(general)/toggle-button/variants.tsx:10` (`variant="secondary" activeVariant="danger"` → `variant="soft" tone="neutral" activeVariant="solid" activeTone="danger"`).
- `(overlay)/popover/dismiss-control.tsx:14`; `(overlay)/dialog/scrollable-fullscreen.tsx:13,27`; `(form)/form/manual-error.tsx:36`; `(form)/input-group/actions.tsx:53`.
- `form-integration.tsx` submit buttons in `(form)/` select, checkbox-group, radio-group, checkbox, input-number, switch, input, file-upload, textarea, multi-select, combobox, slider.

Docs prose:

- `docs/pages/docs/(styling)/design.mdx:20,33` (`bg-primary-hover`, `--<color>-hover/active` rows) → surfaces only; tones use `bg-tone-hover` / alpha.
- `docs/pages/docs/(styling)/customization.mdx:34` — `bg-danger hover:bg-danger-hover` → `<Button variant="solid" tone="danger">` or `bg-danger hover:bg-danger/90`.
- `docs/pages/docs/(overview)/unocss.mdx:253` and `docs/pages/docs/(overview)/tailwind.mdx:75` — `--primary-hover` state variable guidance → rewrite for surfaces + `--mo-mix-*` knobs. `unocss.mdx` `colorStates` mentions → `mix`.
- `docs/DESIGN.md:68` — `--primary-hover` / `--primary-active` → drop; mention derived tone states.
- `docs/shared/color-tokens.ts:14,16` (doc comments) and `docs/shared/color-tokens.test.ts:34,35,68` (`primary-hover` / `primary-active` tokens) → tone rows expose `ink`; state rows only for surfaces.

Tests / fixtures:

- `src/theme/tailwind.test.ts:138-145,219-251,1038-1043` and `src/theme/unocss.test.ts:229-265,532-546,565-580,620-652,705-721,782-805,832-848` — `--mo-auto-*`, tone `-hover/-active`, `colorStates` assertions → rewrite (gated declarations, `mix` knobs, `bg-secondary` stays valid as a tone utility).
- `test/consumer-fixtures/unocss.test.ts:148-153` — `--primary-hover` fixture → use a surface state (e.g. `--accent-hover`) or `--mo-mix-hover`.
- `test/types-default/index.tsx:625` — `variant="secondary"` → `variant="soft" tone="neutral"`; `test/types-default/preset-theme.ts` `colorStates` → `mix`.
- `src/element/button/button.test.tsx:186-187,1158,1183`; `src/element/button-group/button-group.test.tsx:199,221,316`; `src/element/toggle-button/toggle-button.test.tsx:51,58,237`; `src/overlay/toast/toast.test.tsx:123`; `src/form/input-number/input-number.test.tsx:1529-1530` — `bg-secondary` / `*-hover` class assertions → assert `bg-tone` / `bg-tone/12` plus `--mo-tone` style.

Counts: 123 matching lines across 41 files (including `colorStates`): 4 `src` files (button.recipe, input-number.recipe, toast-item, unocss.ts), 19 demo files (21 hits), 8 docs prose/tooling/config files, 10 test/fixture files. No `--mo-auto-secondary` reference exists outside tests.

## Docs and tests

- **Docs:**
  - Rewrite the color sections of [unocss.mdx](<docs/pages/docs/(overview)/unocss.mdx>) (Hover and active colors, configuration table, mix knobs, removal of duplicate Wind3 alpha fallback), [design.mdx](<docs/pages/docs/(styling)/design.mdx>) and [customization.mdx](<docs/pages/docs/(styling)/customization.mdx>).
  - Do NOT add migration guides or legacy mapping tables to docs (all migration details live strictly in git commit messages).
  - Update [docs/shared/color-tokens.ts](docs/shared/color-tokens.ts).
  - Migrate `variant="danger"`, `variant="secondary"`, and `variant="subtle"` across docs, demos and `test/types-default`.
- **Tests to add/update:**
  - **Automated WCAG 2.2 AA Contrast Suite:** Add test asserting that all 7 tones in both Light and Dark themes satisfy `contrastRatio(base, foreground) >= 4.5:1` in `DEFAULT_THEME_COLORS` against `--background`.
  - **Tone Channel Isolation Tests:** Verify at type level and runtime that `tone` is NOT present in `MoraineThemeColors`, cannot be configured in `override`, and is never emitted in theme CSS.
  - **Mix Input Contract & Validation Tests:**
    - Verify numbers in `0..100` format as `${n}%`.
    - Verify numbers $< 0$, $> 100$, NaN, and Infinity throw `RangeError`.
    - Verify non-number/non-string types throw `TypeError`.
    - Verify string CSS expressions (e.g. `'calc(var(--custom) * 1%)'`) pass through as-is.
  - **resolveThemes Inheritance & Precedence Tests:**
    - Verify top-level `presetMoraine({ mix: ... })` is inherited by `:root` and `.dark` defaults.
    - Verify theme-specific overrides take precedence over top-level shared mix.
  - **UnoCSS Wind3 Alpha Tests:** Verify that `wind3: true` outputs a single `color-mix()` rule per alpha utility without duplicate solid fallbacks.
  - **Component Tests:** Update Button, Badge, ToggleButton, ButtonGroup, Toast, and AlertDialog tests to assert `--mo-tone` styles and new variant/tone combinations.
- Run `pnpm run qa` and `pnpm run test`.

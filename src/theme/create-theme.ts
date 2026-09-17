import type { RecipeLayerConfig } from './style/recipe'
import type { DefineThemeOptions, MoraineTheme } from './types'

// Public subpath bundles may contain separate copies of this module. Use the
// global symbol registry so a theme created from `moraine/theme` remains
// readable by the resolver bundled into the main `moraine` entry.
const THEME_LAYERS: unique symbol = Symbol.for('moraine.theme.layers') as never

export interface ThemeLayer {
  readonly overrides: Readonly<Record<string, Readonly<Record<string, unknown>>>>
}

type InternalTheme = MoraineTheme & {
  readonly [THEME_LAYERS]: readonly ThemeLayer[]
}

function freezeObject(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      freezeObject(item)
    }
    return Object.freeze(value)
  }
  for (const item of Object.values(value)) {
    freezeObject(item)
  }
  return Object.freeze(value)
}

/** Creates an immutable layered Moraine theme override. */
export function defineTheme(options: DefineThemeOptions = {}): MoraineTheme {
  const { extends: parent, ...entries } = options
  const overrides: Record<string, Readonly<Record<string, unknown>>> = {}
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined) {
      continue
    }
    overrides[key] = freezeObject({ ...value }) as Readonly<Record<string, unknown>>
  }
  const layers = Object.freeze([
    ...getThemeLayers(parent),
    Object.freeze({ overrides: Object.freeze(overrides) }),
  ])
  return Object.freeze(
    Object.defineProperty({}, THEME_LAYERS, { value: layers, enumerable: false }),
  ) as MoraineTheme
}

export function getThemeLayers(theme: MoraineTheme | undefined): readonly ThemeLayer[] {
  return theme ? (theme as InternalTheme)[THEME_LAYERS] : []
}

export function getThemeRecipeLayers<S extends object, V>(
  theme: MoraineTheme,
  key: string,
): readonly (RecipeLayerConfig<S, V> & { replace?: true })[] {
  return getThemeLayers(theme).flatMap((layer) => {
    const override = layer.overrides[key]
    return override ? [override] : []
  })
}

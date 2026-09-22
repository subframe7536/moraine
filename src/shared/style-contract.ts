import type { Accessor } from 'solid-js'

export type DataAttributeValue = string | number | boolean | null | undefined
type MaybeAccessor<T> = T | Accessor<T>

export type AttributeNameWithoutDataPrefix<Name extends string = string> =
  Name extends `data-${string}` ? never : Name

type CamelCase<Name extends string> = Name extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : Name

type DataAttributeState<Names extends readonly string[]> = {
  [Name in Names[number] as CamelCase<Name>]: MaybeAccessor<DataAttributeValue>
}

type DataAttributeResult<Names extends readonly string[]> = {
  readonly [Name in Names[number] as `data-${Name}`]: string | number | undefined
}

declare const DATA_ATTRIBUTE_RESOLVER: unique symbol

interface DataAttributeResolverMarker {
  readonly [DATA_ATTRIBUTE_RESOLVER]: true
}

export type DataAttributeResolver<Names extends readonly string[]> = ((
  state: DataAttributeState<Names>,
) => DataAttributeResult<Names>) &
  DataAttributeResolverMarker

export type DataAttributeContract<Slot extends string> = Partial<
  Record<Slot, DataAttributeResolverMarker>
>

function readSource(source: MaybeAccessor<DataAttributeValue>): DataAttributeValue {
  return typeof source === 'function' ? source() : source
}

function normalizeStyleContractValue(value: DataAttributeValue): string | number | undefined {
  if (value === true) {
    return ''
  }
  if (value === false || value === null || value === undefined) {
    return undefined
  }
  return value
}

function stateKey(attributeName: string): string {
  return attributeName.replace(/-([a-z0-9])/gu, (_match, character: string) =>
    character.toUpperCase(),
  )
}

export function createDataAttributes<const Names extends readonly string[]>(
  ...names: Names & {
    [Index in keyof Names]: Names[Index] extends string
      ? AttributeNameWithoutDataPrefix<Names[Index]>
      : never
  }
): DataAttributeResolver<Names> {
  const mappings = names.map((name) => [`data-${name}`, stateKey(name)] as const)
  return ((state: DataAttributeState<Names>) => {
    const result = {} as DataAttributeResult<Names>
    for (const [attributeName, sourceName] of mappings) {
      Object.defineProperty(result, attributeName, {
        enumerable: true,
        configurable: false,
        get: () =>
          normalizeStyleContractValue(
            readSource(
              (state as Readonly<Record<string, MaybeAccessor<DataAttributeValue>>>)[sourceName],
            ),
          ),
      })
    }
    return result
  }) as DataAttributeResolver<Names>
}

export function applyDataAttributes(
  element: Element,
  attributes: Readonly<Record<string, string | number | undefined>>,
): void {
  for (const key of Object.keys(attributes)) {
    const value = attributes[key]
    if (value === undefined) {
      element.removeAttribute(key)
    } else {
      element.setAttribute(key, String(value))
    }
  }
}

import type { Accessor, JSX } from 'solid-js'

export type DataAttributeValue = string | number | boolean | null | undefined
export type MaybeAccessor<T> = T | Accessor<T>

export type StyleContractState = Record<string, MaybeAccessor<DataAttributeValue>>
type StyleContractSource = StyleContractState
type StyleContractResult<T extends StyleContractSource> = {
  readonly [K in keyof T]: string | number | undefined
}

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

function createReactiveProperties<T extends StyleContractSource>(
  sources: T,
): StyleContractResult<T> {
  const result = {} as StyleContractResult<T>
  for (const key of Object.keys(sources) as Array<keyof T>) {
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: false,
      get: () => normalizeStyleContractValue(readSource(sources[key])),
    })
  }
  return result
}

export function createDataAttributes<T extends StyleContractSource>(
  sources: T,
): StyleContractResult<T> {
  return createReactiveProperties(sources)
}

export function createCssVariables<T extends StyleContractSource>(
  sources: T,
): StyleContractResult<T> {
  return createReactiveProperties(sources)
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

export function mergeStyleContract(
  contract: Readonly<Record<string, string | number | undefined>>,
  style?: JSX.CSSProperties,
): JSX.CSSProperties {
  const result: Record<string, string | number | undefined> = {}
  for (const source of [contract, style ?? {}]) {
    const sourceRecord = source as Record<string, string | number | undefined>
    for (const key of Object.keys(source)) {
      Object.defineProperty(result, key, {
        enumerable: true,
        configurable: true,
        get: () => sourceRecord[key],
      })
    }
  }
  return result
}

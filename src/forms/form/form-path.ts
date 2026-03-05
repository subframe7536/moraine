export type FormFieldPath = readonly PropertyKey[]

export function toFieldPath(name: string | string[] | undefined): string[] | undefined {
  if (name === undefined) {
    return undefined
  }

  if (Array.isArray(name)) {
    return name
  }

  return [name]
}

export function pathToKey(path: FormFieldPath): string {
  return path.join('.')
}

export function pathStartsWith(errorPath: FormFieldPath, fieldPath: FormFieldPath): boolean {
  if (fieldPath.length > errorPath.length) {
    return false
  }

  for (let i = 0; i < fieldPath.length; i += 1) {
    if (String(errorPath[i]) !== String(fieldPath[i])) {
      return false
    }
  }

  return true
}

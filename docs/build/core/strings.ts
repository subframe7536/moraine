export function toSingleQuoted(value: string): string {
  return `'${value.replaceAll('\\', String.raw`\\`).replaceAll("'", String.raw`\'`)}'`
}

export function toKebabCase(value: string): string {
  return value
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replaceAll(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replaceAll(/[^a-zA-Z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .toLowerCase()
}

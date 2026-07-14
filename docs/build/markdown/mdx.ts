export function asObjectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

export function getStaticStringAttribute(
  node: Record<string, unknown>,
  componentName: string,
  attributeName: string,
  id: string,
): string | null {
  const attributes = Array.isArray(node.attributes) ? node.attributes : []
  const attribute = attributes.map(asObjectRecord).find((item) => item?.name === attributeName)
  if (!attribute) {
    return null
  }

  if (attribute.type !== 'mdxJsxAttribute' || typeof attribute.name !== 'string') {
    throw new Error(`[docs-mdx] unsupported JSX attribute in ${id}`)
  }

  if (typeof attribute.value === 'string') {
    return attribute.value
  }

  throw new Error(
    `[docs-mdx] <${componentName} /> requires a static "${attributeName}" string in ${id}`,
  )
}

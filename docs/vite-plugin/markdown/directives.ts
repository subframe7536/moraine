import YAML from 'yaml'

import { toKebabCase, toPosixPath } from '../core/strings'

import type { ParsedSegment } from './types'

interface ParseSegmentsOptions {
  directiveAliases?: Map<string, string>
}

function normalizeWidgetPayload(payload: Record<string, unknown>): {
  markdownText?: string
  props?: Record<string, unknown>
} {
  const nextPayload = { ...payload }
  const title = typeof nextPayload.title === 'string' ? nextPayload.title.trim() : ''
  const description =
    typeof nextPayload.description === 'string' ? nextPayload.description.trim() : ''

  if ('title' in nextPayload) {
    delete nextPayload.title
  }
  if ('description' in nextPayload) {
    delete nextPayload.description
  }

  const markdownParts: string[] = []
  if (title) {
    markdownParts.push(`## ${title}`)
  }
  if (description) {
    markdownParts.push(description)
  }

  return {
    markdownText: markdownParts.length > 0 ? markdownParts.join('\n\n') : undefined,
    props: Object.keys(nextPayload).length > 0 ? nextPayload : undefined,
  }
}

function parseDirectivePayload(
  raw: string,
  id: string,
  directive: string,
): Record<string, unknown> {
  if (!raw.trim()) {
    return {}
  }

  try {
    const parsed = YAML.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${directive} payload must be an object`)
    }
    return parsed as Record<string, unknown>
  } catch (error) {
    throw new Error(`[example-markdown] invalid ${directive} block in ${id}: ${String(error)}`)
  }
}

export function parseSegments(
  source: string,
  id: string,
  options: ParseSegmentsOptions = {},
): ParsedSegment[] {
  const lines = source.split(/\r?\n/g)
  const segments: ParsedSegment[] = []
  const markdownBuffer: string[] = []

  const flushMarkdown = () => {
    const text = markdownBuffer.join('\n').trim()
    markdownBuffer.length = 0
    if (text) {
      segments.push({ type: 'markdown', text })
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? ''
    if (!line.startsWith(':::')) {
      markdownBuffer.push(lines[index] ?? '')
      continue
    }

    const directiveName = line.slice(3).trim()
    if (!directiveName) {
      markdownBuffer.push(lines[index] ?? '')
      continue
    }

    const normalizedDirectiveName = options.directiveAliases?.get(directiveName) ?? directiveName

    flushMarkdown()

    const payloadLines: string[] = []
    let foundEnd = false

    for (index += 1; index < lines.length; index += 1) {
      if ((lines[index]?.trim() ?? '') === ':::') {
        foundEnd = true
        break
      }
      payloadLines.push(lines[index] ?? '')
    }

    if (!foundEnd) {
      throw new Error(`[example-markdown] unclosed :::${normalizedDirectiveName} block in ${id}`)
    }

    const payload = parseDirectivePayload(
      payloadLines.join('\n'),
      id,
      `:::${normalizedDirectiveName}`,
    )

    if (normalizedDirectiveName === 'example') {
      const name = payload.name
      if (typeof name !== 'string' || !name.trim()) {
        throw new Error(`[example-markdown] :::example requires "name" in ${id}`)
      }

      const sourcePath = payload.source
      segments.push({
        type: 'example',
        name: name.trim(),
        source:
          typeof sourcePath === 'string' && sourcePath.trim()
            ? toPosixPath(sourcePath.trim())
            : `./examples/${toKebabCase(name.trim())}.tsx`,
        ...(typeof sourcePath === 'string' && sourcePath.trim()
          ? { explicitSource: true as const }
          : {}),
      })
      continue
    }

    const WIDGET_DIRECTIVES = [
      'docs-header',
      'docs-api-reference',
      'intro-cards',
      'intro-components',
      'toast-hosts',
    ] as const

    if (WIDGET_DIRECTIVES.includes(normalizedDirectiveName as (typeof WIDGET_DIRECTIVES)[number])) {
      const { markdownText, props } = normalizeWidgetPayload(payload)

      if (markdownText) {
        segments.push({
          type: 'markdown',
          text: markdownText,
        })
      }

      segments.push({
        type: normalizedDirectiveName as (typeof WIDGET_DIRECTIVES)[number],
        ...(props ? { props } : {}),
      })
      continue
    }

    if (normalizedDirectiveName === 'code-tabs') {
      const packageName = payload.package
      if (typeof packageName !== 'string' || !packageName.trim()) {
        throw new Error(`[example-markdown] :::code-tabs requires "package" in ${id}`)
      }

      segments.push({
        type: 'code-tabs',
        packageName: packageName.trim(),
      })
      continue
    }

    throw new Error(`[example-markdown] unsupported :::${normalizedDirectiveName} block in ${id}`)
  }

  flushMarkdown()

  return segments
}

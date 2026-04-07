import type MagicString from 'magic-string'

export interface Replacement {
  start: number
  end: number
  value: string
}

export type ReplacementFactory = (
  start: number,
  end: number,
  text: string,
  source: string,
) => Replacement | null

const REGEXP_NORMALIZE_ID = /[?#].*$/
export function normalizeId(id: string): string {
  return id.replace(REGEXP_NORMALIZE_ID, '')
}

interface Span {
  start: number
  end: number
}

interface ParsedCall {
  callee: Span
  args: Span[]
}

interface ParsedString {
  contentStart: number
  contentEnd: number
  close: number
}

interface ParsedTemplate extends ParsedString {
  hasInterpolation: boolean
}

interface ParsedObjectProperty {
  key: string | null
  value: Span
}

const TSX_SUFFIX = '.tsx'
const CLASS_TS_SUFFIX = '.class.ts'
const REGEXP_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/
const REGEXP_TRAILING_IDENTIFIER = /[A-Za-z0-9_$]+$/
const REGEXP_LEADING_WHITESPACE = /\s*/y
const REGEXP_TRAILING_WHITESPACE = /\s*$/
const REGEXP_QUOTED_SINGLE_BODY = /(?:\\.|[^'\\])*/y
const REGEXP_QUOTED_DOUBLE_BODY = /(?:\\.|[^"\\])*/y
const REGEXP_TEMPLATE_BODY = /(?:\\.|[^`\\])*/y
const REGEXP_TEMPLATE_INTERPOLATION_OR_ESCAPE = /\\.|(\$\{)/g
const REGEXP_CVA_CALL = /\bcva\s*\(/g
const REGEXP_VARIANT_DECL = /\b(?:const|let|var)\s+[A-Za-z_$][A-Za-z0-9_$]*VARIANT\b/g
const REGEXP_CLASS_ATTRIBUTE = /\bclass\s*=\s*/g
const CLASS_HELPER_WITH_CLASS_ARGS_FROM_SECOND = new Set(['getItemClass'])

function isClassFile(id: string): boolean {
  return id.endsWith(CLASS_TS_SUFFIX)
}

function isTsxFile(id: string): boolean {
  return id.endsWith(TSX_SUFFIX)
}

function skipWhitespace(source: string, index: number, end = source.length): number {
  if (index >= end) {
    return index
  }

  REGEXP_LEADING_WHITESPACE.lastIndex = index
  REGEXP_LEADING_WHITESPACE.exec(source)
  return Math.min(REGEXP_LEADING_WHITESPACE.lastIndex, end)
}

function trimSpan(source: string, span: Span): Span | null {
  const start = skipWhitespace(source, span.start, span.end)
  if (start >= span.end) {
    return null
  }

  const segment = source.slice(start, span.end)
  const trailingWhitespaceLength = segment.match(REGEXP_TRAILING_WHITESPACE)?.[0].length ?? 0
  const end = span.end - trailingWhitespaceLength
  if (start >= end) {
    return null
  }

  return { start, end }
}

function parseQuotedString(source: string, start: number, quote: "'" | '"'): ParsedString | null {
  if (source[start] !== quote) {
    return null
  }

  const quotedBodyRegex = quote === "'" ? REGEXP_QUOTED_SINGLE_BODY : REGEXP_QUOTED_DOUBLE_BODY
  quotedBodyRegex.lastIndex = start + 1
  const body = quotedBodyRegex.exec(source)
  if (!body) {
    return null
  }

  const close = quotedBodyRegex.lastIndex
  if (source[close] !== quote) {
    return null
  }

  return {
    contentStart: start + 1,
    contentEnd: close,
    close,
  }
}

function hasTemplateInterpolation(rawContent: string): boolean {
  REGEXP_TEMPLATE_INTERPOLATION_OR_ESCAPE.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = REGEXP_TEMPLATE_INTERPOLATION_OR_ESCAPE.exec(rawContent))) {
    if (match[1]) {
      return true
    }
  }

  return false
}

function parseTemplateLiteral(source: string, start: number): ParsedTemplate | null {
  if (source[start] !== '`') {
    return null
  }

  REGEXP_TEMPLATE_BODY.lastIndex = start + 1
  const body = REGEXP_TEMPLATE_BODY.exec(source)
  if (!body) {
    return null
  }

  const close = REGEXP_TEMPLATE_BODY.lastIndex
  if (source[close] !== '`') {
    return null
  }

  const rawContent = source.slice(start + 1, close)
  return {
    contentStart: start + 1,
    contentEnd: close,
    close,
    hasInterpolation: hasTemplateInterpolation(rawContent),
  }
}

function skipStringOrComment(source: string, index: number, end: number): number {
  const char = source[index]
  const next = source[index + 1]

  if (char === "'" || char === '"') {
    const parsed = parseQuotedString(source, index, char)
    return parsed ? parsed.close + 1 : end
  }

  if (char === '`') {
    const parsed = parseTemplateLiteral(source, index)
    return parsed ? parsed.close + 1 : end
  }

  if (char === '/' && next === '/') {
    let cursor = index + 2
    while (cursor < end && source[cursor] !== '\n') {
      cursor += 1
    }
    return cursor
  }

  if (char === '/' && next === '*') {
    let cursor = index + 2
    while (cursor + 1 < end) {
      if (source[cursor] === '*' && source[cursor + 1] === '/') {
        return cursor + 2
      }
      cursor += 1
    }
    return end
  }

  return index
}

function collectIgnoredSpans(source: string): Span[] {
  const spans: Span[] = []
  let index = 0

  while (index < source.length) {
    const char = source[index]
    const next = source[index + 1]
    const canStartIgnoredSpan =
      char === "'" ||
      char === '"' ||
      char === '`' ||
      (char === '/' && (next === '/' || next === '*'))

    if (!canStartIgnoredSpan) {
      index += 1
      continue
    }

    const end = skipStringOrComment(source, index, source.length)
    if (end <= index) {
      index += 1
      continue
    }

    spans.push({ start: index, end })
    index = end
  }

  return spans
}

function isIgnoredIndex(ignoredSpans: Span[], index: number): boolean {
  let left = 0
  let right = ignoredSpans.length - 1

  while (left <= right) {
    const mid = (left + right) >> 1
    const span = ignoredSpans[mid]!

    if (index < span.start) {
      right = mid - 1
      continue
    }

    if (index >= span.end) {
      left = mid + 1
      continue
    }

    return true
  }

  return false
}

function findMatching(source: string, start: number, open: string, close: string): number {
  if (source[start] !== open) {
    return -1
  }

  let depth = 0
  let index = start
  while (index < source.length) {
    const skipped = skipStringOrComment(source, index, source.length)
    if (skipped !== index) {
      index = skipped
      continue
    }

    const char = source[index]
    if (char === open) {
      depth += 1
    } else if (char === close) {
      depth -= 1
      if (depth === 0) {
        return index
      }
    }
    index += 1
  }

  return -1
}

function forEachTopLevelChar(
  source: string,
  start: number,
  end: number,
  callback: (index: number, char: string, paren: number, bracket: number, brace: number) => void,
): void {
  let paren = 0
  let bracket = 0
  let brace = 0
  let index = start

  while (index < end) {
    const skipped = skipStringOrComment(source, index, end)
    if (skipped !== index) {
      index = skipped
      continue
    }

    const char = source[index] ?? ''
    callback(index, char, paren, bracket, brace)

    if (char === '(') {
      paren += 1
    } else if (char === ')') {
      paren = Math.max(0, paren - 1)
    } else if (char === '[') {
      bracket += 1
    } else if (char === ']') {
      bracket = Math.max(0, bracket - 1)
    } else if (char === '{') {
      brace += 1
    } else if (char === '}') {
      brace = Math.max(0, brace - 1)
    }

    index += 1
  }
}

function splitTopLevel(source: string, start: number, end: number, delimiter: string): Span[] {
  const spans: Span[] = []
  let current = start

  forEachTopLevelChar(source, start, end, (index, char, paren, bracket, brace) => {
    if (char === delimiter && paren === 0 && bracket === 0 && brace === 0) {
      spans.push({ start: current, end: index })
      current = index + 1
    }
  })

  spans.push({ start: current, end })
  return spans
}

function getTrailingIdentifier(source: string, span: Span): string | null {
  const text = source.slice(span.start, span.end).replace(REGEXP_TRAILING_WHITESPACE, '')
  if (!text) {
    return null
  }

  const match = text.match(REGEXP_TRAILING_IDENTIFIER)
  if (!match) {
    return null
  }

  return match[0]
}

function parseCall(source: string, span: Span): ParsedCall | null {
  const trimmed = trimSpan(source, span)
  if (!trimmed) {
    return null
  }

  let open = -1
  forEachTopLevelChar(source, trimmed.start, trimmed.end, (index, char, paren, bracket, brace) => {
    if (open !== -1) {
      return
    }
    if (char === '(' && paren === 0 && bracket === 0 && brace === 0) {
      open = index
    }
  })

  if (open === -1) {
    return null
  }

  const close = findMatching(source, open, '(', ')')
  if (close === -1 || close >= trimmed.end) {
    return null
  }

  const tail = trimSpan(source, { start: close + 1, end: trimmed.end })
  if (tail) {
    return null
  }

  return {
    callee: { start: trimmed.start, end: open },
    args: splitTopLevel(source, open + 1, close, ','),
  }
}

function parseStaticStringSpan(source: string, span: Span): Span | null {
  const trimmed = trimSpan(source, span)
  if (!trimmed) {
    return null
  }

  const head = source[trimmed.start]
  const tail = source[trimmed.end - 1]

  if ((head === "'" || head === '"') && tail === head) {
    const parsed = parseQuotedString(source, trimmed.start, head)
    if (parsed && parsed.close + 1 === trimmed.end) {
      return {
        start: parsed.contentStart,
        end: parsed.contentEnd,
      }
    }
  }

  if (head === '`' && tail === '`') {
    const parsed = parseTemplateLiteral(source, trimmed.start)
    if (parsed && parsed.close + 1 === trimmed.end && !parsed.hasInterpolation) {
      return {
        start: parsed.contentStart,
        end: parsed.contentEnd,
      }
    }
  }

  return null
}

function unwrapParens(source: string, span: Span): Span {
  let current = trimSpan(source, span)
  while (current && source[current.start] === '(' && source[current.end - 1] === ')') {
    const close = findMatching(source, current.start, '(', ')')
    if (close !== current.end - 1) {
      break
    }
    current = trimSpan(source, { start: current.start + 1, end: current.end - 1 })
  }

  return current ?? span
}

function findTopLevelLogical(source: string, span: Span): { start: number; length: 2 } | null {
  const trimmed = trimSpan(source, span)
  if (!trimmed) {
    return null
  }

  let result: { start: number; length: 2 } | null = null
  forEachTopLevelChar(source, trimmed.start, trimmed.end, (index, char, paren, bracket, brace) => {
    if (result || paren !== 0 || bracket !== 0 || brace !== 0) {
      return
    }
    const next = source[index + 1]
    if ((char === '&' && next === '&') || (char === '|' && next === '|')) {
      result = { start: index, length: 2 }
    }
  })

  return result
}

function findTopLevelConditional(
  source: string,
  span: Span,
): { question: number; colon: number } | null {
  const trimmed = trimSpan(source, span)
  if (!trimmed) {
    return null
  }

  let depth = 0
  let firstQuestion = -1
  let matchedColon = -1

  forEachTopLevelChar(source, trimmed.start, trimmed.end, (index, char, paren, bracket, brace) => {
    if (matchedColon !== -1 || paren !== 0 || bracket !== 0 || brace !== 0) {
      return
    }

    if (char === '?') {
      depth += 1
      if (firstQuestion === -1) {
        firstQuestion = index
      }
      return
    }

    if (char === ':' && depth > 0) {
      depth -= 1
      if (depth === 0) {
        matchedColon = index
      }
    }
  })

  if (firstQuestion === -1 || matchedColon === -1) {
    return null
  }

  return {
    question: firstQuestion,
    colon: matchedColon,
  }
}

function parseObjectProperties(source: string, objectSpan: Span): ParsedObjectProperty[] {
  const trimmed = trimSpan(source, objectSpan)
  if (!trimmed || source[trimmed.start] !== '{' || source[trimmed.end - 1] !== '}') {
    return []
  }

  const close = findMatching(source, trimmed.start, '{', '}')
  if (close !== trimmed.end - 1) {
    return []
  }

  const rawEntries = splitTopLevel(source, trimmed.start + 1, trimmed.end - 1, ',')
  const properties: ParsedObjectProperty[] = []

  for (const entry of rawEntries) {
    const property = trimSpan(source, entry)
    if (!property) {
      continue
    }

    let colon = -1
    forEachTopLevelChar(
      source,
      property.start,
      property.end,
      (index, char, paren, bracket, brace) => {
        if (colon !== -1 || paren !== 0 || bracket !== 0 || brace !== 0) {
          return
        }
        if (char === ':') {
          colon = index
        }
      },
    )

    if (colon === -1) {
      continue
    }

    const rawKey = trimSpan(source, { start: property.start, end: colon })
    const rawValue = trimSpan(source, { start: colon + 1, end: property.end })
    if (!rawKey || !rawValue) {
      continue
    }

    let key: string | null = null
    const keyString = parseStaticStringSpan(source, rawKey)
    if (keyString) {
      key = source.slice(keyString.start, keyString.end)
    } else {
      const keyText = source.slice(rawKey.start, rawKey.end)
      if (REGEXP_VALID_IDENTIFIER.test(keyText)) {
        key = keyText
      }
    }

    properties.push({
      key,
      value: rawValue,
    })
  }

  return properties
}

function queueReplacement(
  replacements: Map<string, Replacement>,
  content: Span,
  source: string,
  factory: ReplacementFactory,
): void {
  const replacement = factory(
    content.start,
    content.end,
    source.slice(content.start, content.end),
    source,
  )
  if (!replacement) {
    return
  }

  const key = `${replacement.start}:${replacement.end}`
  replacements.set(key, replacement)
}

function collectVariantLeafClassReplacements(
  source: string,
  objectSpan: Span,
  replacements: Map<string, Replacement>,
  factory: ReplacementFactory,
): void {
  for (const property of parseObjectProperties(source, objectSpan)) {
    const stringSpan = parseStaticStringSpan(source, property.value)
    if (stringSpan) {
      queueReplacement(replacements, stringSpan, source, factory)
      continue
    }

    const nested = trimSpan(source, property.value)
    if (!nested || source[nested.start] !== '{' || source[nested.end - 1] !== '}') {
      continue
    }

    if (findMatching(source, nested.start, '{', '}') === nested.end - 1) {
      collectVariantLeafClassReplacements(source, nested, replacements, factory)
    }
  }
}

function collectCvaReplacements(
  source: string,
  replacements: Map<string, Replacement>,
  factory: ReplacementFactory,
  ignoredSpans: Span[],
): void {
  REGEXP_CVA_CALL.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = REGEXP_CVA_CALL.exec(source))) {
    if (isIgnoredIndex(ignoredSpans, match.index)) {
      continue
    }

    const openParen = match.index + match[0].lastIndexOf('(')
    const closeParen = findMatching(source, openParen, '(', ')')
    if (closeParen === -1) {
      continue
    }

    const args = splitTopLevel(source, openParen + 1, closeParen, ',')
    const base = args[0] ? parseStaticStringSpan(source, args[0]) : null
    if (base) {
      queueReplacement(replacements, base, source, factory)
    }

    const config = args[1] ? trimSpan(source, args[1]) : null
    if (!config || source[config.start] !== '{' || source[config.end - 1] !== '}') {
      REGEXP_CVA_CALL.lastIndex = closeParen + 1
      continue
    }

    if (findMatching(source, config.start, '{', '}') !== config.end - 1) {
      REGEXP_CVA_CALL.lastIndex = closeParen + 1
      continue
    }

    const properties = parseObjectProperties(source, config)
    const variants = properties.find((property) => property.key === 'variants')
    if (variants) {
      const variantsObject = trimSpan(source, variants.value)
      if (
        variantsObject &&
        source[variantsObject.start] === '{' &&
        source[variantsObject.end - 1] === '}' &&
        findMatching(source, variantsObject.start, '{', '}') === variantsObject.end - 1
      ) {
        collectVariantLeafClassReplacements(source, variantsObject, replacements, factory)
      }
    }

    const compoundVariants = properties.find((property) => property.key === 'compoundVariants')
    if (compoundVariants) {
      const compoundArray = trimSpan(source, compoundVariants.value)
      if (
        compoundArray &&
        source[compoundArray.start] === '[' &&
        source[compoundArray.end - 1] === ']' &&
        findMatching(source, compoundArray.start, '[', ']') === compoundArray.end - 1
      ) {
        const elements = splitTopLevel(source, compoundArray.start + 1, compoundArray.end - 1, ',')
        for (const element of elements) {
          const objectElement = trimSpan(source, element)
          if (
            !objectElement ||
            source[objectElement.start] !== '{' ||
            source[objectElement.end - 1] !== '}' ||
            findMatching(source, objectElement.start, '{', '}') !== objectElement.end - 1
          ) {
            continue
          }

          const classProperty = parseObjectProperties(source, objectElement).find(
            (property) => property.key === 'class',
          )
          if (!classProperty) {
            continue
          }

          const classString = parseStaticStringSpan(source, classProperty.value)
          if (!classString) {
            continue
          }

          queueReplacement(replacements, classString, source, factory)
        }
      }
    }

    REGEXP_CVA_CALL.lastIndex = closeParen + 1
  }
}

function collectVariantConstReplacements(
  source: string,
  replacements: Map<string, Replacement>,
  factory: ReplacementFactory,
  ignoredSpans: Span[],
): void {
  REGEXP_VARIANT_DECL.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = REGEXP_VARIANT_DECL.exec(source))) {
    if (isIgnoredIndex(ignoredSpans, match.index)) {
      continue
    }

    let cursor = match.index + match[0].length
    let equalIndex = -1

    while (cursor < source.length) {
      const skipped = skipStringOrComment(source, cursor, source.length)
      if (skipped !== cursor) {
        cursor = skipped
        continue
      }

      const char = source[cursor]
      if (char === '=') {
        equalIndex = cursor
        break
      }
      if (char === ';') {
        break
      }
      cursor += 1
    }

    if (equalIndex === -1) {
      continue
    }

    const valueStart = skipWhitespace(source, equalIndex + 1)
    if (source[valueStart] !== '{') {
      continue
    }

    const valueEnd = findMatching(source, valueStart, '{', '}')
    if (valueEnd === -1) {
      continue
    }

    collectVariantLeafClassReplacements(
      source,
      { start: valueStart, end: valueEnd + 1 },
      replacements,
      factory,
    )

    REGEXP_VARIANT_DECL.lastIndex = valueEnd + 1
  }
}

function collectClassOperandReplacements(
  source: string,
  span: Span,
  replacements: Map<string, Replacement>,
  factory: ReplacementFactory,
  insideClassesArg = false,
): void {
  const trimmed = trimSpan(source, unwrapParens(source, span))
  if (!trimmed) {
    return
  }

  const stringSpan = parseStaticStringSpan(source, trimmed)
  if (stringSpan) {
    queueReplacement(replacements, stringSpan, source, factory)
    return
  }

  const conditional = findTopLevelConditional(source, trimmed)
  if (conditional) {
    collectClassOperandReplacements(
      source,
      { start: conditional.question + 1, end: conditional.colon },
      replacements,
      factory,
      insideClassesArg,
    )
    collectClassOperandReplacements(
      source,
      { start: conditional.colon + 1, end: trimmed.end },
      replacements,
      factory,
      insideClassesArg,
    )
    return
  }

  const logical = findTopLevelLogical(source, trimmed)
  if (logical) {
    collectClassOperandReplacements(
      source,
      { start: logical.start + logical.length, end: trimmed.end },
      replacements,
      factory,
      insideClassesArg,
    )
    return
  }

  if (source[trimmed.start] === '[' && source[trimmed.end - 1] === ']') {
    const arrayEnd = findMatching(source, trimmed.start, '[', ']')
    if (arrayEnd === trimmed.end - 1) {
      for (const element of splitTopLevel(source, trimmed.start + 1, trimmed.end - 1, ',')) {
        collectClassOperandReplacements(source, element, replacements, factory, insideClassesArg)
      }
      return
    }
  }

  const call = parseCall(source, trimmed)
  if (!call) {
    return
  }

  const callName = getTrailingIdentifier(source, call.callee)
  if (!callName) {
    return
  }

  if (callName === 'cn') {
    if (insideClassesArg) {
      return
    }

    for (const arg of call.args) {
      collectClassOperandReplacements(source, arg, replacements, factory, false)
    }
    return
  }

  if (callName.endsWith('Variants')) {
    for (const arg of call.args.slice(1)) {
      collectClassOperandReplacements(source, arg, replacements, factory, true)
    }
    return
  }

  if (CLASS_HELPER_WITH_CLASS_ARGS_FROM_SECOND.has(callName)) {
    for (const arg of call.args.slice(1)) {
      collectClassOperandReplacements(source, arg, replacements, factory, false)
    }
  }
}

function collectTsxClassReplacements(
  source: string,
  replacements: Map<string, Replacement>,
  factory: ReplacementFactory,
  ignoredSpans: Span[],
): void {
  REGEXP_CLASS_ATTRIBUTE.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = REGEXP_CLASS_ATTRIBUTE.exec(source))) {
    if (isIgnoredIndex(ignoredSpans, match.index)) {
      continue
    }

    const valueStart = skipWhitespace(source, match.index + match[0].length)
    const head = source[valueStart]

    if (head === "'" || head === '"') {
      const parsed = parseQuotedString(source, valueStart, head)
      if (parsed) {
        queueReplacement(
          replacements,
          { start: parsed.contentStart, end: parsed.contentEnd },
          source,
          factory,
        )
        REGEXP_CLASS_ATTRIBUTE.lastIndex = parsed.close + 1
      }
      continue
    }

    if (head === '{') {
      const close = findMatching(source, valueStart, '{', '}')
      if (close !== -1) {
        collectClassOperandReplacements(
          source,
          { start: valueStart + 1, end: close },
          replacements,
          factory,
        )
        REGEXP_CLASS_ATTRIBUTE.lastIndex = close + 1
      }
    }
  }
}

function applyReplacements(
  code: MagicString,
  source: string,
  replacements: Map<string, Replacement>,
): void {
  if (replacements.size === 0) {
    return
  }

  const sorted = Array.from(replacements.values()).sort((left, right) => right.start - left.start)
  let nextSource = source

  for (const replacement of sorted) {
    nextSource =
      nextSource.slice(0, replacement.start) + replacement.value + nextSource.slice(replacement.end)
  }

  if (nextSource !== source) {
    code.overwrite(0, code.original.length, nextSource)
  }
}

export function runTransform(code: MagicString, id: string, factory: ReplacementFactory): void {
  const normalizedId = normalizeId(id)
  const source = code.toString()
  const ignoredSpans = collectIgnoredSpans(source)
  const replacements = new Map<string, Replacement>()

  if (isClassFile(normalizedId)) {
    collectCvaReplacements(source, replacements, factory, ignoredSpans)
    collectVariantConstReplacements(source, replacements, factory, ignoredSpans)
    applyReplacements(code, source, replacements)
    return
  }

  if (!isTsxFile(normalizedId)) {
    return
  }

  collectTsxClassReplacements(source, replacements, factory, ignoredSpans)
  applyReplacements(code, source, replacements)
}

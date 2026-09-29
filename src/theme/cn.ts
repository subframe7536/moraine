import type { ClassValue } from 'cn'
import type { ConfigExtension } from 'cn/config'
import { createCn as upstreamCreateCn, defaultConfig, mergeConfigs, validators } from 'cn/config'

export type { ConfigExtension as CnConfig } from 'cn/config'

/** An independent class merger; empty input produces undefined for DOM bindings. */
export type Cn = (...classes: ClassValue[]) => string | undefined

const MORAINE_CN_RULES: ConfigExtension = {
  extend: {
    classGroups: {
      z: ['z-base', 'z-raised', 'z-control', 'z-sticky', 'z-resize', 'z-overlay', 'z-floating'],
      'enter-opacity': [{ 'enter-opacity': [validators.isAny] }],
      'exit-opacity': [{ 'exit-opacity': [validators.isAny] }],
      'enter-scale': [{ 'enter-scale': [validators.isAny] }],
      'exit-scale': [{ 'exit-scale': [validators.isAny] }],
      'enter-translate-x': [{ 'enter-translate-x': [validators.isAny] }],
      'exit-translate-x': [{ 'exit-translate-x': [validators.isAny] }],
      'enter-translate-y': [{ 'enter-translate-y': [validators.isAny] }],
      'exit-translate-y': [{ 'exit-translate-y': [validators.isAny] }],
      'enter-rotate': [{ 'enter-rotate': [validators.isAny] }],
      'exit-rotate': [{ 'exit-rotate': [validators.isAny] }],
    },
  },
}

/** Creates an owner-independent merger using defaults, Moraine rules, then application rules. */
export function createCn(config: ConfigExtension = {}): Cn {
  const resolved = mergeConfigs(mergeConfigs(defaultConfig(), MORAINE_CN_RULES), config)
  // Use extension input so upstream preserves cacheSize, including zero.
  const engineCn = upstreamCreateCn({
    override: {
      theme: resolved.theme,
      classGroups: resolved.classGroups,
      conflictingClassGroups: resolved.conflictingClassGroups,
      conflictingClassGroupModifiers: resolved.conflictingClassGroupModifiers,
      orderSensitiveModifiers: resolved.orderSensitiveModifiers,
    },
    prefix: resolved.prefix,
    cacheSize: config.cacheSize,
  })
  return (...classes) => engineCn(...classes) || undefined
}

/** Fixed default rules, independent of all Providers. */
export const cn: Cn = createCn()

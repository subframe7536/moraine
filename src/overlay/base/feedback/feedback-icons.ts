import type { IconT } from '../../../element/icon'

export const FEEDBACK_TYPE_ICONS = {
  info: 'icon-info',
  success: 'icon-success',
  warning: 'icon-warning',
  error: 'icon-error',
  loading: 'icon-loading',
} as const

export const FEEDBACK_CAUTION_ICON = 'icon-caution'

export function resolveFeedbackIcon(options: {
  type?: string
  icon?: IconT.Name
  danger?: boolean | null
}): IconT.Name | undefined {
  if (options.icon !== undefined) {
    return options.icon
  }
  if (options.type && options.type !== 'default' && options.type in FEEDBACK_TYPE_ICONS) {
    return FEEDBACK_TYPE_ICONS[options.type as keyof typeof FEEDBACK_TYPE_ICONS]
  }
  if (options.danger) {
    return FEEDBACK_CAUTION_ICON
  }
  return undefined
}

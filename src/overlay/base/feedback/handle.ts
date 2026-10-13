import type { FeedbackCloseReason, FeedbackHandle, FeedbackId } from './feedback.types'

export interface CloseResult {
  result: () => Promise<FeedbackCloseReason>
  /** Resolves `result()` once. Later calls do nothing and return false. */
  settle: (reason: FeedbackCloseReason) => boolean
}

export function createCloseResult(): CloseResult {
  let settled = false
  let resolveResult: (reason: FeedbackCloseReason) => void = () => undefined
  const promise = new Promise<FeedbackCloseReason>((resolve) => {
    resolveResult = resolve
  })
  return {
    result: () => promise,
    settle: (reason) => {
      if (settled) {
        return false
      }
      settled = true
      resolveResult(reason)
      return true
    },
  }
}

/** Handle returned for calls made on the server, where no host is mounted. */
export function inertFeedbackHandle<Update>(id: FeedbackId = 0): FeedbackHandle<Update> {
  const { result, settle } = createCloseResult()
  settle('api')
  return {
    id,
    update: () => undefined,
    close: () => undefined,
    result,
  }
}

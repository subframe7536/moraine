import { DEV } from 'solid-js'
import { isServer } from 'solid-js/web'

export interface FeedbackHost {
  id: () => string | undefined
}

export interface HostRegistry<T extends FeedbackHost> {
  register: (host: T) => () => void
  active: (hostId?: string) => T | undefined
  require: (hostId?: string) => T
  entries: () => readonly T[]
}

export function createHostRegistry<T extends FeedbackHost>(componentName: string): HostRegistry<T> {
  const hosts: T[] = []

  const missingMessage = (hostId?: string): string => {
    if (hostId === undefined) {
      return `Mount <${componentName}> before calling ${componentName}.`
    }
    return `Mount <${componentName} id="${hostId}"> before calling ${componentName}.`
  }

  /** Without `hostId`, only hosts without an id receive the call. */
  const active = (hostId?: string): T | undefined => {
    for (let index = hosts.length - 1; index >= 0; index -= 1) {
      const host = hosts[index]
      if (host?.id() === hostId) {
        return host
      }
    }
    return undefined
  }

  const warnDuplicate = (host: T): void => {
    if (!DEV) {
      return
    }
    const id = host.id()
    const duplicate = hosts.some((item) => item !== host && item.id() === id)
    if (!duplicate) {
      return
    }
    console.warn(
      id
        ? `[moraine] Duplicate <${componentName} id="${id}">. The last mounted host takes precedence.`
        : `[moraine] Duplicate <${componentName}> without id. Mount one default host, or give each instance an id.`,
    )
  }

  return {
    register: (host) => {
      if (isServer) {
        return () => undefined
      }
      hosts.push(host)
      warnDuplicate(host)
      return () => {
        const index = hosts.lastIndexOf(host)
        if (index !== -1) {
          hosts.splice(index, 1)
        }
      }
    },
    active,
    require: (hostId) => {
      const host = active(hostId)
      if (!host) {
        throw new Error(missingMessage(hostId))
      }
      return host
    },
    entries: () => hosts,
  }
}

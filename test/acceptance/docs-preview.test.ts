// @vitest-environment node

import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import type { AddressInfo } from 'node:net'
import { resolve } from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

const PROJECT_ROOT = resolve(import.meta.dirname, '../..')

type PreviewStream = {
  setEncoding: (encoding: string) => void
  on: (event: string, listener: (chunk: string) => void) => void
}

type PreviewProcess = {
  pid: number | undefined
  exitCode: number | null
  stdout: PreviewStream | null
  stderr: PreviewStream | null
}

let previewProcess: PreviewProcess | undefined
let previewOutput = ''

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function reservePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address() as AddressInfo
  const port = address.port
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  return port
}

function processGroupExists(pid: number | undefined): boolean {
  if (!pid) {
    return false
  }
  try {
    process.kill(-pid, 0)
    return true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH'
  }
}

async function waitForProcessGroupExit(pid: number | undefined, timeout: number): Promise<void> {
  const deadline = Date.now() + timeout
  while (processGroupExists(pid) && Date.now() < deadline) {
    await delay(100)
  }
  if (processGroupExists(pid)) {
    throw new Error(`Preview process group ${pid} did not exit within ${timeout}ms.`)
  }
}

async function stopPreviewProcess(): Promise<void> {
  const child = previewProcess
  if (!child?.pid) {
    previewProcess = undefined
    return
  }

  const pid = child.pid
  try {
    if (processGroupExists(pid)) {
      try {
        process.kill(-pid, 'SIGTERM')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ESRCH') {
          throw error
        }
      }
      try {
        await waitForProcessGroupExit(pid, 5_000)
      } catch {
        if (processGroupExists(pid)) {
          try {
            process.kill(-pid, 'SIGKILL')
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ESRCH') {
              throw error
            }
          }
        }
        await waitForProcessGroupExit(pid, 5_000)
      }
    }
  } finally {
    previewProcess = undefined
  }
}

async function fetchRenderedDocsPage(port: number, timeout: number): Promise<string> {
  const paths = ['/styling', '/styling/', '/styling.html']
  const deadline = Date.now() + timeout
  let lastError = 'no successful response'

  while (Date.now() < deadline) {
    for (const path of paths) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}${path}`)
        if (response.ok) {
          return await response.text()
        }
        lastError = `${path} returned HTTP ${response.status}`
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
      }
    }
    if (previewProcess?.exitCode !== null && previewProcess?.exitCode !== undefined) {
      throw new Error(`Preview exited before becoming healthy: ${lastError}\n${previewOutput}`)
    }
    await delay(250)
  }

  throw new Error(`Timed out waiting for docs preview: ${lastError}\n${previewOutput}`)
}

describe('production documentation preview', () => {
  afterEach(async () => {
    const pid = previewProcess?.pid
    await stopPreviewProcess()
    expect(processGroupExists(pid)).toBe(false)
  }, 15_000)

  test('starts, serves a rendered styling page, and terminates cleanly', async () => {
    const port = await reservePort()
    previewOutput = ''
    previewProcess = spawn(
      'nub',
      ['run', 'docs:preview', '--host', '127.0.0.1', '--port', String(port)],
      {
        cwd: PROJECT_ROOT,
        detached: true,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    previewProcess.stdout?.setEncoding('utf8')
    previewProcess.stderr?.setEncoding('utf8')
    previewProcess.stdout?.on('data', (chunk: string) => {
      previewOutput += chunk
    })
    previewProcess.stderr?.on('data', (chunk: string) => {
      previewOutput += chunk
    })

    const page = await fetchRenderedDocsPage(port, 120_000)
    expect(page).toContain('styling system architecture uses atomic utility classes')
    expect(page).toContain('moraine/tailwind')
    expect(page).toContain('presetMoraine()')
    expect(page).toContain('moraine/icon.css')
    expect(page).toContain('Provider defaults.')
    expect(page).toContain('cn()')
    expect(page).toContain('recipe')
    expect(page).toContain('CSS property objects')
    expect(page).not.toMatch(/(?:runtime|hydration)\s+(?:error|mismatch)/i)
    expect(previewOutput).not.toMatch(/(?:runtime|hydration)\s+(?:error|mismatch)/i)
  }, 180_000)
})

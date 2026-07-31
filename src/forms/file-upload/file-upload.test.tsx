import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { FileUpload } from './file-upload'
import type { FileUploadProps } from './file-upload'

function createFile(
  name: string,
  type = 'text/plain',
  content = 'content',
  lastModified = 1,
): File {
  return new File([content], name, { type, lastModified })
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]')

  if (!input) {
    throw new Error('File input not found')
  }

  return input as HTMLInputElement
}

async function setInputFiles(input: HTMLInputElement, files: File[]): Promise<void> {
  await fireEvent.change(input, {
    target: { files },
    currentTarget: { files },
  })
}

async function dropFiles(target: HTMLElement, files: File[]): Promise<void> {
  let dataTransfer:
    | DataTransfer
    | {
        files: File[] | FileList
        items: Array<{ kind: string; type: string; getAsFile: () => File }>
        types: string[]
      }

  if (typeof DataTransfer !== 'undefined') {
    const transfer = new DataTransfer()
    for (const file of files) {
      transfer.items.add(file)
    }
    dataTransfer = transfer
  } else {
    dataTransfer = {
      files,
      items: files.map((file) => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      })),
      types: ['Files'],
    }
  }

  await fireEvent.dragOver(target, { dataTransfer })
  await fireEvent.drop(target, { dataTransfer })
}

describe('FileUpload', () => {
  test('accepts arbitrary root props at type level', () => {
    const props: FileUploadProps = { highlight: true }

    expect(props).toBeDefined()
  })

  test('supports tuple click handlers on the upload control', async () => {
    const onClick = vi.fn((_data: string, _event: MouseEvent) => undefined)
    const screen = render(() => <FileUpload onClick={[onClick, 'payload']} />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    await fireEvent.click(control)

    expect(onClick).toHaveBeenCalledWith('payload', expect.any(MouseEvent))
  })

  test('renders base attributes and text', () => {
    const screen = render(() => (
      <FileUpload
        id="upload-input"
        name="attachments"
        accept="image/*"
        multiple
        required
        disabled
        label="Upload files"
        description="PNG, JPG up to 2MB"
      />
    ))

    const input = getFileInput(screen.container)

    expect(input.getAttribute('id')).toBe('upload-input')
    expect(input.getAttribute('name')).toBe('attachments')
    expect(input.getAttribute('accept')).toBe('image/*')
    expect(input.multiple).toBe(true)
    expect(input.required).toBe(true)
    expect(input.disabled).toBe(true)
    expect(screen.getByText('Upload files')).not.toBeNull()
    expect(screen.getByText('PNG, JPG up to 2MB')).not.toBeNull()
  })

  test('single mode emits File | null', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload onValueChange={onValueChange} />)
    const input = getFileInput(screen.container)

    const first = createFile('first.txt')
    await setInputFiles(input, [first])

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenLastCalledWith(first)
    expect(screen.container.querySelectorAll('[data-slot="file"]').length).toBe(1)
  })

  test('multiple mode appends files and emits File[]', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload multiple onValueChange={onValueChange} />)
    const input = getFileInput(screen.container)

    const first = createFile('first.txt')
    const second = createFile('second.txt')

    await setInputFiles(input, [first])
    await setInputFiles(input, [second])

    expect(onValueChange).toHaveBeenCalledTimes(2)
    expect(onValueChange).toHaveBeenLastCalledWith([first, second])
    expect(screen.container.querySelectorAll('[data-slot="file"]').length).toBe(2)
  })

  test('dropzone flow accepts files when enabled', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload multiple dropzone onValueChange={onValueChange} />)
    const base = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    const file = createFile('drop.txt')

    await dropFiles(base, [file])

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenLastCalledWith([file])
  })

  test('dropzone=false does not process drop files', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <FileUpload multiple dropzone={false} onValueChange={onValueChange} />
    ))
    const base = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    const file = createFile('drop-disabled.txt')

    await dropFiles(base, [file])

    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('dropzone drag-over uses color feedback without scale transform', async () => {
    const screen = render(() => <FileUpload dropzone />)
    const base = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    expect(base.className).not.toContain('scale-[')

    await fireEvent.dragOver(base)

    await waitFor(() => {
      expect(base.className).toContain('bg-primary/8')
    })
    expect(base.className).not.toContain('scale-[')
  })

  test('remove file updates list and emitted value for multiple mode', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload multiple onValueChange={onValueChange} />)
    const input = getFileInput(screen.container)

    const first = createFile('first.txt')
    const second = createFile('second.txt')
    await setInputFiles(input, [first, second])

    let removeButtons = screen.container.querySelectorAll('[data-slot="fileRemove"]')
    expect(removeButtons.length).toBe(2)

    await fireEvent.click(removeButtons[0]!)
    expect(onValueChange).toHaveBeenLastCalledWith([second])

    removeButtons = screen.container.querySelectorAll('[data-slot="fileRemove"]')
    await fireEvent.click(removeButtons[0]!)
    expect(onValueChange).toHaveBeenLastCalledWith([])
    expect(screen.container.querySelectorAll('[data-slot="file"]').length).toBe(0)
  })

  test('remove file emits null in single mode', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload onValueChange={onValueChange} />)
    const input = getFileInput(screen.container)
    const file = createFile('single.txt')

    await setInputFiles(input, [file])

    const removeButton = screen.container.querySelector('[data-slot="fileRemove"]') as HTMLElement
    await fireEvent.click(removeButton)

    expect(onValueChange).toHaveBeenNthCalledWith(1, file)
    expect(onValueChange).toHaveBeenNthCalledWith(2, null)
  })

  test('preview creates and revokes object URL for image files', async () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation(() => 'blob:preview-image')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    try {
      const screen = render(() => <FileUpload multiple />)
      const input = getFileInput(screen.container)
      const image = createFile('image.png', 'image/png', 'img')
      const text = createFile('note.txt', 'text/plain')

      await setInputFiles(input, [image, text])

      expect(createObjectURL).toHaveBeenCalledTimes(1)
      expect(screen.container.querySelector('[data-slot="files"]')).not.toBeNull()

      const removeButtons = screen.container.querySelectorAll('[data-slot="fileRemove"]')
      await fireEvent.click(removeButtons[0]!)

      await waitFor(() => {
        expect(revokeObjectURL).toHaveBeenCalled()
      })
    } finally {
      createObjectURL.mockRestore()
      revokeObjectURL.mockRestore()
    }
  })

  test('preview=false hides file list', async () => {
    const screen = render(() => <FileUpload preview={false} />)
    const input = getFileInput(screen.container)

    await setInputFiles(input, [createFile('file.txt')])

    expect(screen.container.querySelector('[data-slot="files"]')).toBeNull()
  })

  test('clears hidden input and supports selecting same file again after remove', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload onValueChange={onValueChange} />)
    const input = getFileInput(screen.container)
    const file = createFile('repeat.txt')

    await setInputFiles(input, [file])
    await fireEvent.click(screen.container.querySelector('[data-slot="fileRemove"]') as HTMLElement)
    await setInputFiles(input, [file])

    expect(onValueChange).toHaveBeenCalledTimes(3)
    expect(onValueChange).toHaveBeenNthCalledWith(1, file)
    expect(onValueChange).toHaveBeenNthCalledWith(2, null)
    expect(onValueChange).toHaveBeenNthCalledWith(3, file)
  })

  test('applies class overrides for root and file slots', async () => {
    const screen = render(() => (
      <FileUpload multiple classes={{ root: 'root-override', file: 'file-override' }} />
    ))
    const input = getFileInput(screen.container)

    await setInputFiles(input, [createFile('styled.txt')])

    const root = screen.container.querySelector('[data-slot="root"]')
    const file = screen.container.querySelector('[data-slot="file"]')

    expect(root?.className).toContain('root-override')
    expect(file?.className).toContain('file-override')
  })

  test('applies style overrides for root and file slots', async () => {
    const screen = render(() => (
      <FileUpload multiple styles={{ root: { width: '200px' }, file: { width: '200px' } } as any} />
    ))
    const input = getFileInput(screen.container)

    await setInputFiles(input, [createFile('styled.txt')])

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const file = screen.container.querySelector('[data-slot="file"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(file?.style.width).toBe('200px')
  })

  test('calls onFileReject when files are rejected', async () => {
    const onFileReject = vi.fn()
    const screen = render(() => <FileUpload multiple maxFiles={1} onFileReject={onFileReject} />)
    const input = getFileInput(screen.container)

    await setInputFiles(input, [createFile('a.txt'), createFile('b.txt')])

    expect(onFileReject).toHaveBeenCalledTimes(1)
  })

  test('rejects files smaller than minSize', async () => {
    const onValueChange = vi.fn()
    const onFileReject = vi.fn()
    const screen = render(() => (
      <FileUpload multiple minSize={4} onValueChange={onValueChange} onFileReject={onFileReject} />
    ))
    const input = getFileInput(screen.container)
    const small = createFile('small.txt', 'text/plain', 'abc')
    const valid = createFile('valid.txt', 'text/plain', 'abcd')

    await setInputFiles(input, [small, valid])

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenLastCalledWith([valid])
    expect(onFileReject).toHaveBeenCalledWith([{ file: small, errors: ['FILE_TOO_SMALL'] }])
  })

  test('rejects files larger than maxSize', async () => {
    const onValueChange = vi.fn()
    const onFileReject = vi.fn()
    const screen = render(() => (
      <FileUpload multiple maxSize={4} onValueChange={onValueChange} onFileReject={onFileReject} />
    ))
    const input = getFileInput(screen.container)
    const valid = createFile('valid.txt', 'text/plain', 'abcd')
    const large = createFile('large.txt', 'text/plain', 'abcde')

    await setInputFiles(input, [valid, large])

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenLastCalledWith([valid])
    expect(onFileReject).toHaveBeenCalledWith([{ file: large, errors: ['FILE_TOO_LARGE'] }])
  })

  test('rejects duplicate files from the same batch and existing list', async () => {
    const onValueChange = vi.fn()
    const onFileReject = vi.fn()
    const screen = render(() => (
      <FileUpload multiple onValueChange={onValueChange} onFileReject={onFileReject} />
    ))
    const input = getFileInput(screen.container)
    const first = createFile('same.txt', 'text/plain', 'content', 100)
    const duplicateInBatch = createFile('same.txt', 'text/plain', 'content', 100)
    const duplicateExisting = createFile('same.txt', 'text/plain', 'content', 100)

    await setInputFiles(input, [first, duplicateInBatch])
    await setInputFiles(input, [duplicateExisting])

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenLastCalledWith([first])
    expect(onFileReject).toHaveBeenNthCalledWith(1, [
      { file: duplicateInBatch, errors: ['FILE_DUPLICATE'] },
    ])
    expect(onFileReject).toHaveBeenNthCalledWith(2, [
      { file: duplicateExisting, errors: ['FILE_DUPLICATE'] },
    ])
  })

  test('keeps accepted type and maxFiles rejection behavior', async () => {
    const onValueChange = vi.fn()
    const onFileReject = vi.fn()
    const screen = render(() => (
      <FileUpload
        multiple
        accept="image/*"
        maxFiles={1}
        onValueChange={onValueChange}
        onFileReject={onFileReject}
      />
    ))
    const input = getFileInput(screen.container)
    const image = createFile('image.png', 'image/png', 'img')
    const text = createFile('note.txt', 'text/plain', 'text')
    const extra = createFile('extra.png', 'image/png', 'extra')

    await setInputFiles(input, [image, text, extra])

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenLastCalledWith([image])
    expect(onFileReject).toHaveBeenCalledWith([
      { file: text, errors: ['FILE_INVALID_TYPE'] },
      { file: extra, errors: ['TOO_MANY_FILES'] },
    ])
  })

  test('readOnly keeps selected files and disables removal', async () => {
    const onValueChange = vi.fn()
    const [readOnly, setReadOnly] = createSignal(false)
    const screen = render(() => (
      <FileUpload multiple readOnly={readOnly()} onValueChange={onValueChange} />
    ))
    const input = getFileInput(screen.container)

    await setInputFiles(input, [createFile('locked.txt')])

    setReadOnly(true)

    await waitFor(() => {
      expect(
        (screen.container.querySelector('[data-slot="fileRemove"]') as HTMLButtonElement | null)
          ?.disabled,
      ).toBe(true)
    })

    await fireEvent.click(screen.container.querySelector('[data-slot="fileRemove"]') as HTMLElement)

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(screen.container.querySelectorAll('[data-slot="file"]').length).toBe(1)
    expect(
      screen.container.querySelector('[data-slot="root"]')?.getAttribute('data-readonly'),
    ).toBe('')
  })
})

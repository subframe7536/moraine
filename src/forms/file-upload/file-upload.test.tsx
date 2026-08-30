import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { FormField } from '../form-field/form-field.tsx'
import { createForm, Form } from '../form/index.ts'

import { FileUpload } from './file-upload.tsx'

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
  fireEvent.change(input, {
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
        dropEffect: string
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
      dropEffect: 'none',
    }
  }

  fireEvent.dragOver(target, { dataTransfer })
  fireEvent.drop(target, { dataTransfer })
}

describe('FileUpload', () => {
  test('supports tuple click handlers on the upload control', async () => {
    const onClick = vi.fn((_data: string, _event: MouseEvent) => undefined)
    const screen = render(() => <FileUpload onClick={[onClick, 'payload']} />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    fireEvent.click(control)

    expect(onClick).toHaveBeenCalledWith('payload', expect.any(MouseEvent))
  })

  test('opens the picker from click, Enter, and Space while respecting cancellation', async () => {
    const onKeyDown = vi.fn((event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
      }
    })
    const screen = render(() => <FileUpload onKeyDown={onKeyDown} />)
    const control = screen.getByRole('button', { name: 'File upload' })
    const input = getFileInput(screen.container)
    const inputClick = vi.spyOn(input, 'click').mockImplementation(() => undefined)

    fireEvent.click(control)
    fireEvent.keyDown(control, { key: 'Enter' })
    fireEvent.keyDown(control, { key: ' ' })
    fireEvent.keyDown(control, { key: 'Escape' })

    expect(inputClick).toHaveBeenCalledTimes(3)
    expect(onKeyDown).toHaveBeenCalledTimes(3)

    inputClick.mockRestore()

    const canceled = render(() => (
      <FileUpload onClick={(event) => event.preventDefault()} dropzone={false} />
    ))
    const canceledInput = getFileInput(canceled.container)
    const canceledClick = vi.spyOn(canceledInput, 'click').mockImplementation(() => undefined)

    fireEvent.click(canceled.getByRole('button', { name: 'File upload' }))
    expect(canceledClick).not.toHaveBeenCalled()
    canceledClick.mockRestore()

    const readOnly = render(() => <FileUpload readOnly />)
    const readOnlyInput = getFileInput(readOnly.container)
    const readOnlyClick = vi.spyOn(readOnlyInput, 'click').mockImplementation(() => undefined)
    const readOnlyControl = readOnly.getByRole('button', { name: 'File upload' })

    fireEvent.click(readOnlyControl)
    fireEvent.keyDown(readOnlyControl, { key: 'Enter' })
    expect(readOnlyClick).not.toHaveBeenCalled()
    readOnlyClick.mockRestore()
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

    fireEvent.dragOver(base, {
      dataTransfer: {
        files: [],
        items: [{ kind: 'file' }],
        types: ['Files'],
        dropEffect: 'none',
      },
    })

    await waitFor(() => {
      expect(base.getAttribute('data-dragging')).toBe('')
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

    fireEvent.click(removeButtons[0]!)
    expect(onValueChange).toHaveBeenLastCalledWith([second])

    removeButtons = screen.container.querySelectorAll('[data-slot="fileRemove"]')
    fireEvent.click(removeButtons[0]!)
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
    fireEvent.click(removeButton)

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
      fireEvent.click(removeButtons[0]!)

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

  test('creates preview URLs only while previews are mounted and revokes each URL once', async () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation(() => 'blob:preview-image')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const [preview, setPreview] = createSignal(false)

    try {
      const screen = render(() => <FileUpload preview={preview()} />)
      const image = createFile('image.png', 'image/png', 'img')

      await setInputFiles(getFileInput(screen.container), [image])
      expect(createObjectURL).not.toHaveBeenCalled()

      setPreview(true)
      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1))

      setPreview(false)
      await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledTimes(1))

      screen.unmount()
      expect(revokeObjectURL).toHaveBeenCalledTimes(1)
    } finally {
      createObjectURL.mockRestore()
      revokeObjectURL.mockRestore()
    }
  })

  test('does not create a preview URL for a rejected image', async () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation(() => 'blob:rejected-image')

    try {
      const screen = render(() => <FileUpload accept="text/plain" />)

      await setInputFiles(getFileInput(screen.container), [
        createFile('image.png', 'image/png', 'img'),
      ])

      expect(createObjectURL).not.toHaveBeenCalled()
      expect(screen.container.querySelector('[data-slot="file"]')).toBeNull()
    } finally {
      createObjectURL.mockRestore()
    }
  })

  test('replaces preview URL ownership and cleans the remaining URL on unmount', async () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation((value) => `blob:${(value as File).name}`)
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    try {
      const screen = render(() => <FileUpload />)
      const input = getFileInput(screen.container)

      await setInputFiles(input, [createFile('first.png', 'image/png', 'first')])
      await setInputFiles(input, [createFile('second.png', 'image/png', 'second')])

      expect(createObjectURL).toHaveBeenCalledTimes(2)
      expect(revokeObjectURL).toHaveBeenCalledTimes(1)
      expect(revokeObjectURL).toHaveBeenNthCalledWith(1, 'blob:first.png')

      screen.unmount()
      expect(revokeObjectURL).toHaveBeenCalledTimes(2)
      expect(revokeObjectURL).toHaveBeenNthCalledWith(2, 'blob:second.png')
    } finally {
      createObjectURL.mockRestore()
      revokeObjectURL.mockRestore()
    }
  })

  test('ignores non-file drags, sets copy effect for files, and ignores nested dragleave', async () => {
    const screen = render(() => <FileUpload />)
    const control = screen.getByRole('button', { name: 'File upload' })
    const nonFileTransfer = {
      files: [],
      items: [],
      types: ['text/plain'],
      dropEffect: 'none',
    }
    const fileTransfer = {
      files: [],
      items: [{ kind: 'file' }],
      types: ['Files'],
      dropEffect: 'none',
    }

    fireEvent.dragOver(control, { dataTransfer: nonFileTransfer })
    expect(control.getAttribute('data-dragging')).toBeNull()
    expect(nonFileTransfer.dropEffect).toBe('none')

    fireEvent.dragOver(control, { dataTransfer: fileTransfer })
    expect(control.getAttribute('data-dragging')).toBe('')
    expect(fileTransfer.dropEffect).toBe('copy')

    const nestedLeave = new Event('dragleave', { bubbles: true, cancelable: true })
    Object.defineProperty(nestedLeave, 'relatedTarget', {
      value: control.querySelector('[data-slot="wrapper"]'),
    })
    fireEvent(control, nestedLeave)
    expect(control.getAttribute('data-dragging')).toBe('')

    fireEvent.dragLeave(control, { relatedTarget: document.body })
    expect(control.getAttribute('data-dragging')).toBeNull()
  })

  test('respects canceled drag handlers and does not process non-file drops', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <FileUpload onValueChange={onValueChange} onDragOver={(event) => event.preventDefault()} />
    ))
    const control = screen.getByRole('button', { name: 'File upload' })
    const fileTransfer = {
      files: [createFile('blocked.txt')],
      items: [{ kind: 'file' }],
      types: ['Files'],
      dropEffect: 'none',
    }

    fireEvent.dragOver(control, { dataTransfer: fileTransfer })
    expect(control.getAttribute('data-dragging')).toBeNull()
    expect(fileTransfer.dropEffect).toBe('none')

    fireEvent.drop(control, {
      dataTransfer: { files: [], items: [], types: ['text/plain'], dropEffect: 'none' },
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('clears hidden input and supports selecting same file again after remove', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload onValueChange={onValueChange} />)
    const input = getFileInput(screen.container)
    const file = createFile('repeat.txt')

    await setInputFiles(input, [file])
    fireEvent.click(screen.container.querySelector('[data-slot="fileRemove"]') as HTMLElement)
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
      <FileUpload multiple styles={{ root: { width: '200px' }, file: { width: '200px' } }} />
    ))
    const input = getFileInput(screen.container)

    await setInputFiles(input, [createFile('styled.txt')])

    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')
    const file = screen.container.querySelector<HTMLElement>('[data-slot="file"]')

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

  test('reports type and size errors together and honors maxFiles zero in single mode', async () => {
    const onFileReject = vi.fn()
    const screen = render(() => (
      <FileUpload accept="image/*" maxSize={2} maxFiles={0} onFileReject={onFileReject} />
    ))
    const invalid = createFile('note.txt', 'text/plain', 'large')
    const validButDisallowed = createFile('image.png', 'image/png', 'ok')

    await setInputFiles(getFileInput(screen.container), [invalid, validButDisallowed])

    expect(onFileReject).toHaveBeenCalledWith([
      { file: invalid, errors: ['FILE_INVALID_TYPE', 'FILE_TOO_LARGE'] },
      { file: validButDisallowed, errors: ['TOO_MANY_FILES'] },
    ])
  })

  test('clears files, previews, and form value on native reset without emitting a callback', async () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation(() => 'blob:reset-image')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const onValueChange = vi.fn()

    try {
      const screen = render(() => (
        <form>
          <FileUpload name="attachment" onValueChange={onValueChange} />
        </form>
      ))
      const form = screen.container.querySelector('form') as HTMLFormElement
      const image = createFile('image.png', 'image/png', 'img')

      await setInputFiles(getFileInput(screen.container), [image])
      expect(screen.container.querySelector('[data-slot="file"]')).not.toBeNull()

      form.reset()

      await waitFor(() => {
        expect(screen.container.querySelector('[data-slot="file"]')).toBeNull()
        expect(revokeObjectURL).toHaveBeenCalledTimes(1)
      })
      expect(onValueChange).toHaveBeenCalledTimes(1)

      screen.unmount()
      expect(revokeObjectURL).toHaveBeenCalledTimes(1)
    } finally {
      createObjectURL.mockRestore()
      revokeObjectURL.mockRestore()
    }
  })

  test('synchronizes accepted files and reset state with FormField submission', async () => {
    const onSubmit = vi.fn()
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ attachment: v.any() }),
          initialInput: { attachment: null },
        }),
      (form) => (
        <Form of={form} onSubmit={onSubmit}>
          <FormField name="attachment" label="Attachment">
            <FileUpload />
          </FormField>
        </Form>
      ),
    )
    const formElement = screen.container.querySelector('form') as HTMLFormElement
    const file = createFile('attachment.txt')

    await setInputFiles(getFileInput(screen.container), [file])
    fireEvent.submit(formElement)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ attachment: file })

    formElement.reset()
    await waitFor(() => expect(screen.container.querySelector('[data-slot="file"]')).toBeNull())
    fireEvent.submit(formElement)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2))
    expect(onSubmit.mock.calls[1]?.[0]).toEqual({ attachment: null })
  })

  test('provides a fallback accessible name and links label and description', () => {
    const unnamed = render(() => <FileUpload />)
    expect(unnamed.getByRole('button', { name: 'File upload' })).not.toBeNull()
    unnamed.unmount()

    const named = render(() => <FileUpload label="Attachments" description="PDF files only" />)
    const control = named.getByRole('button', { name: 'Attachments' })
    const label = named.getByText('Attachments')
    const description = named.getByText('PDF files only')

    expect(control.getAttribute('aria-labelledby')).toBe(label.id)
    expect(control.getAttribute('aria-describedby')).toContain(description.id)
  })

  test('single-evaluates control JSX and conditional props', () => {
    const reads = { description: 0, dropzone: 0, label: 0, preview: 0 }
    const screen = render(() =>
      createComponent(FileUpload, {
        get description() {
          reads.description += 1
          return 'Description'
        },
        get dropzone() {
          reads.dropzone += 1
          return true
        },
        get label() {
          reads.label += 1
          return 'Upload files'
        },
        get preview() {
          reads.preview += 1
          return false
        },
      }),
    )

    expect(screen.getByRole('button', { name: 'Upload files' })).not.toBeNull()
    expect(screen.getByText('Description')).not.toBeNull()
    expect(reads).toEqual({ description: 1, dropzone: 1, label: 1, preview: 1 })
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
        screen.container.querySelector<HTMLButtonElement>('[data-slot="fileRemove"]')?.disabled,
      ).toBe(true)
    })

    fireEvent.click(screen.container.querySelector('[data-slot="fileRemove"]') as HTMLElement)
    await dropFiles(screen.getByRole('button', { name: 'File upload' }), [
      createFile('drop-blocked.txt'),
    ])
    await setInputFiles(input, [createFile('picker-blocked.txt')])

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(screen.container.querySelectorAll('[data-slot="file"]').length).toBe(1)
    expect(
      screen.container.querySelector('[data-slot="root"]')?.getAttribute('data-readonly'),
    ).toBe('')
  })
})

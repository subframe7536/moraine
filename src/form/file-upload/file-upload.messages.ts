import type { MoraineMessages } from '../../provider/locale/messages.types'

export const defaultFileUploadMessages: MoraineMessages['fileUpload'] =
  /* @__PURE__ */ Object.freeze({
    label: 'File upload',
    remove: ({ name }) => `Remove ${name}`,
  })

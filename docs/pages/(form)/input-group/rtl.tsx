import { Button, Icon, Input, InputGroup, Textarea } from '@src'

export function RightToLeft() {
  return (
    <div dir="rtl" class="gap-4 grid max-w-sm w-full">
      <InputGroup>
        <InputGroup.Leading>
          <Icon name="i-lucide:search" />
        </InputGroup.Leading>
        <Input aria-label="بحث" placeholder="بحث..." />
        <InputGroup.Trailing>١٢ نتيجة</InputGroup.Trailing>
      </InputGroup>
      <InputGroup>
        <Input aria-label="جاري البحث" placeholder="جاري البحث..." />
        <InputGroup.Trailing>
          <Icon name="icon-loading" class="animate-spin" />
        </InputGroup.Trailing>
      </InputGroup>
      <InputGroup>
        <Input aria-label="جاري حفظ التغييرات" placeholder="جاري حفظ التغييرات..." />
        <InputGroup.Trailing>
          <span>جاري الحفظ...</span>
          <Icon name="icon-loading" class="animate-spin" />
        </InputGroup.Trailing>
      </InputGroup>
      <InputGroup orientation="vertical">
        <Textarea aria-label="منطقة النص" placeholder="اكتب تعليقًا..." rows={3} />
        <InputGroup.Trailing>
          <span>٠/٢٨٠</span>
          <Button type="button" size="sm" class="ms-auto">
            نشر
          </Button>
        </InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}

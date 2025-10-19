import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface MemoDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memo: {
    id: number
    content: string
    createdAt: string
    updatedAt: string
  } | null
}

export function MemoDetail({ open, onOpenChange, memo }: MemoDetailProps) {
  if (!memo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-background/95 backdrop-blur-md border-2 shadow-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">메모 상세보기</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="text-xs text-muted-foreground">
            {format(new Date(memo.createdAt), "yyyy년 MM월 dd일 (EEE) HH:mm", { locale: ko })}
          </div>

          <div className="p-4 bg-muted/30 rounded-md border border-border">
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground overflow-auto"
              dangerouslySetInnerHTML={{ __html: memo.content }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
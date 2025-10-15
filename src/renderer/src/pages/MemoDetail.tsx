import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { X } from 'lucide-react'
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
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">메모 상세보기</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="text-xs text-muted-foreground">
            {format(new Date(memo.createdAt), "yyyy년 MM월 dd일 (EEE) HH:mm", { locale: ko })}
          </div>

          <div className="p-4 bg-muted/30 rounded-md border border-border">
            <pre className="whitespace-pre-wrap font-mono text-sm text-foreground overflow-auto">
              {memo.content}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
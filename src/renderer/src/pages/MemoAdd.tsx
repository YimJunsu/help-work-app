import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { Textarea } from '../components/ui/textarea'

interface MemoAddProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddMemo: (memo: { content: string }) => void
  editingMemo?: { content: string } | null
}

export function MemoAdd({ open, onOpenChange, onAddMemo, editingMemo }: MemoAddProps) {
  const [content, setContent] = useState('')
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  // Load editing memo data when editingMemo changes
  useEffect(() => {
    if (editingMemo) {
      setContent(editingMemo.content)
    } else {
      setContent('')
    }
  }, [editingMemo])

  const handleAdd = () => {
    if (!content.trim()) {
      setAlertMessage("내용을 입력해주세요.")
      return
    }

    onAddMemo({
      content: content.trim()
    })

    // Reset form
    setContent('')
    setAlertMessage(null)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setContent('')
    setAlertMessage(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-background/95 backdrop-blur-md border-2 shadow-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editingMemo ? 'Edit Memo' : 'Add Memo'}
          </DialogTitle>
          <DialogDescription>
            {editingMemo ? '메모를 수정하세요.' : '새로운 메모를 추가하세요.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {alertMessage && (
            <Alert variant="destructive">
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">내용</label>
            <Textarea
              placeholder="메모 내용을 입력하세요..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setAlertMessage(null)
              }}
              className="min-h-[300px] resize-y border-border focus:border-ring font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              취소
            </Button>
            <Button onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editingMemo ? '수정' : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

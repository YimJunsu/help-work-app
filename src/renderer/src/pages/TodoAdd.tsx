import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

interface TodoAddProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTodo: (todo: { text: string; category?: string }) => void
  editingTodo?: { text: string; category?: string } | null
}

export function TodoAdd({ open, onOpenChange, onAddTodo, editingTodo }: TodoAddProps) {
  const [newTodo, setNewTodo] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  // Load editing todo data when editingTodo changes
  useEffect(() => {
    if (editingTodo) {
      setNewTodo(editingTodo.text)
      setNewCategory(editingTodo.category || '')
    } else {
      setNewTodo('')
      setNewCategory('')
    }
  }, [editingTodo])

  const handleAdd = () => {
    if (!newTodo.trim()) {
      setAlertMessage("할 일을 입력해주세요.")
      return
    }

    onAddTodo({
      text: newTodo.trim(),
      category: newCategory.trim() || undefined
    })

    // Reset form
    setNewTodo('')
    setNewCategory('')
    setAlertMessage(null)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setNewTodo('')
    setNewCategory('')
    setAlertMessage(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-md border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editingTodo ? 'Edit Todo' : 'Add Todo'}
          </DialogTitle>
          <DialogDescription>
            {editingTodo ? '할 일을 수정하세요.' : '오늘의 할 일을 추가하세요.'}
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
            <label className="text-sm font-medium">할 일</label>
            <Input
              placeholder="할 일을 입력하세요"
              value={newTodo}
              onChange={(e) => {
                setNewTodo(e.target.value)
                setAlertMessage(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAdd()}
              className="border-border focus:border-ring"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">카테고리 (선택사항)</label>
            <Input
              placeholder="카테고리를 입력하세요 (예: 업무, 개인, 공부)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="border-border focus:border-ring"
            />
            <p className="text-xs text-muted-foreground">
              입력한 카테고리는 배지로 표시됩니다
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              취소
            </Button>
            <Button onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editingTodo ? '수정' : '추가'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

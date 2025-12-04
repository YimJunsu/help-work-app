import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { Label } from '../components/ui/label'
import type { TodoPriority } from '../hooks/useTodos'

interface TodoAddProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTodo: (todo: { text: string; category?: string; priority?: TodoPriority }) => void
  editingTodo?: { text: string; category?: string; priority?: TodoPriority } | null
}

export function TodoAdd({ open, onOpenChange, onAddTodo, editingTodo }: TodoAddProps) {
  const [newTodo, setNewTodo] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [priority, setPriority] = useState<TodoPriority>('C')
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  // Load editing todo data when editingTodo changes
  useEffect(() => {
    if (editingTodo) {
      setNewTodo(editingTodo.text)
      setNewCategory(editingTodo.category || '')
      setPriority(editingTodo.priority || 'C')
    } else {
      setNewTodo('')
      setNewCategory('')
      setPriority('C')
    }
  }, [editingTodo])

  const handleAdd = () => {
    if (!newTodo.trim()) {
      setAlertMessage("할 일을 입력해주세요.")
      return
    }

    onAddTodo({
      text: newTodo.trim(),
      category: newCategory.trim() || undefined,
      priority
    })

    // Reset form
    setNewTodo('')
    setNewCategory('')
    setPriority('C')
    setAlertMessage(null)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setNewTodo('')
    setNewCategory('')
    setPriority('C')
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

          <div className="space-y-3">
            <label className="text-sm font-medium">우선순위</label>
            <RadioGroup value={priority} onValueChange={(value) => setPriority(value as TodoPriority)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A" id="priority-a" />
                <Label htmlFor="priority-a" className="flex items-center gap-2 cursor-pointer">
                  <span className="w-12 h-6 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-xs font-bold text-red-600">A</span>
                  <span className="text-sm">높음</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="B" id="priority-b" />
                <Label htmlFor="priority-b" className="flex items-center gap-2 cursor-pointer">
                  <span className="w-12 h-6 rounded-full bg-orange-500/20 border border-orange-500 flex items-center justify-center text-xs font-bold text-orange-600">B</span>
                  <span className="text-sm">보통</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="C" id="priority-c" />
                <Label htmlFor="priority-c" className="flex items-center gap-2 cursor-pointer">
                  <span className="w-12 h-6 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center text-xs font-bold text-green-600">C</span>
                  <span className="text-sm">낮음</span>
                </Label>
              </div>
            </RadioGroup>
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

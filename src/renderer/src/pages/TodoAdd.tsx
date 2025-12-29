import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { X } from 'lucide-react'
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
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-background border-0 rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 bg-background">
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent/50 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="text-2xl font-bold text-foreground">
            {editingTodo ? '할 일 수정하기' : '할 일 추가하기'}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-8">
          {/* Todo Input */}
          <div className="space-y-3">
            <label className="block text-base font-semibold text-foreground">
              무엇을 하시겠어요?
            </label>
            <input
              type="text"
              placeholder="할 일을 입력해주세요"
              value={newTodo}
              onChange={(e) => {
                setNewTodo(e.target.value)
                setAlertMessage(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAdd()}
              autoFocus
              className="w-full h-14 px-4 text-base bg-accent/30 dark:bg-accent/50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60"
            />
            {alertMessage && (
              <p className="text-sm text-red-600 dark:text-red-500 font-medium animate-in fade-in-0 slide-in-from-top-1">
                {alertMessage}
              </p>
            )}
          </div>

          {/* Category Input */}
          <div className="space-y-3">
            <label className="block text-base font-semibold text-foreground">
              카테고리 <span className="text-sm font-normal text-muted-foreground">(선택)</span>
            </label>
            <input
              type="text"
              placeholder="업무, 개인, 학습 등"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-full h-14 px-4 text-base bg-accent/30 dark:bg-accent/50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Priority Selection */}
          <div className="space-y-3">
            <label className="block text-base font-semibold text-foreground">
              우선순위
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPriority('A')}
                className={`h-20 rounded-2xl font-semibold text-base transition-all ${
                  priority === 'A'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-accent/40 dark:bg-accent/60 text-muted-foreground hover:bg-accent/60 dark:hover:bg-accent/80'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xl font-bold">A</div>
                  <div className="text-xs opacity-80">긴급</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('B')}
                className={`h-20 rounded-2xl font-semibold text-base transition-all ${
                  priority === 'B'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-accent/40 dark:bg-accent/60 text-muted-foreground hover:bg-accent/60 dark:hover:bg-accent/80'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xl font-bold">B</div>
                  <div className="text-xs opacity-80">중요</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('C')}
                className={`h-20 rounded-2xl font-semibold text-base transition-all ${
                  priority === 'C'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-accent/40 dark:bg-accent/60 text-muted-foreground hover:bg-accent/60 dark:hover:bg-accent/80'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xl font-bold">C</div>
                  <div className="text-xs opacity-80">보통</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Action Button */}
        <div className="p-6 pt-0">
          <Button
            onClick={handleAdd}
            className="w-full h-14 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            {editingTodo ? '수정 완료' : '추가하기'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

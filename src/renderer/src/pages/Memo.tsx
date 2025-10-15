import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Plus, Trash2, FileText, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { MemoAdd } from './MemoAdd'
import { MemoDetail } from './MemoDetail'

interface Memo {
  id: number
  content: string
  createdAt: string
  updatedAt: string
}

interface MemoProps {
  onDialogChange?: (isOpen: boolean) => void
}

export default function Memo({ onDialogChange }: MemoProps) {
  const [memos, setMemos] = useState<Memo[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [deletingMemos, setDeletingMemos] = useState<Set<number>>(new Set())

  // Load memos from database on mount
  useEffect(() => {
    loadMemos()
  }, [])

  const loadMemos = async () => {
    if (window.electron) {
      const memos = await window.electron.ipcRenderer.invoke('memos:getAll')
      setMemos(memos)
    }
  }

  useEffect(() => {
    onDialogChange?.(showAddDialog || showDetailDialog)
  }, [showAddDialog, showDetailDialog, onDialogChange])

  const addMemo = async (memo: { content: string }) => {
    if (window.electron) {
      if (editingMemo) {
        // Update existing memo
        await window.electron.ipcRenderer.invoke('memos:update', editingMemo.id, {
          content: memo.content
        })
        setEditingMemo(null)
      } else {
        // Add new memo
        await window.electron.ipcRenderer.invoke('memos:create', {
          content: memo.content
        })
      }
      await loadMemos()
    }
  }

  const startEditMemo = (memo: Memo) => {
    setEditingMemo(memo)
    setShowAddDialog(true)
    setShowDetailDialog(false)
  }

  const deleteMemoItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingMemos(prev => new Set([...prev, id]))
    setTimeout(async () => {
      if (window.electron) {
        await window.electron.ipcRenderer.invoke('memos:delete', id)
        await loadMemos()
      }
      setDeletingMemos(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }, 300)
  }

  const openMemoDetail = (memo: Memo) => {
    setSelectedMemo(memo)
    setShowDetailDialog(true)
  }

  const getPreviewText = (html: string) => {
    const div = document.createElement('div')
    div.innerHTML = html
    const text = div.textContent || div.innerText || ''
    return text.slice(0, 100) + (text.length > 100 ? '...' : '')
  }

  const memoCount = memos.length

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between min-h-[60px]">
            <div className="flex flex-col justify-center">
              <CardTitle className="text-2xl font-bold text-card-foreground leading-tight">Memo</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                나의 메모장
              </p>
            </div>
            <div className="flex items-center gap-2 h-full">
              <Badge variant="secondary" className="text-sm font-medium">
                {memoCount}개
              </Badge>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-primary border border-border" />
                <div className="w-3 h-3 rounded-full bg-secondary border border-border" />
                <div className="w-3 h-3 rounded-full bg-accent border border-border" />
              </div>
              <Button onClick={() => setShowAddDialog(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md transition-all duration-200">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memos.map((memo) => (
              <Card
                key={memo.id}
                onClick={() => openMemoDetail(memo)}
                className={`border border-border bg-card/70 backdrop-blur-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer group ${
                  deletingMemos.has(memo.id)
                    ? 'transform scale-95 opacity-0'
                    : 'transform scale-100 opacity-100'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 h-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs">
                          {format(new Date(memo.createdAt), "MM/dd HH:mm", { locale: ko })}
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditMemo(memo)
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => deleteMemoItem(memo.id, e)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 min-h-[60px]">
                      <p className="text-sm text-card-foreground line-clamp-3">
                        {getPreviewText(memo.content)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {memos.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">메모가 없습니다</p>
              <p className="text-sm">새로운 메모를 추가해보세요!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 메모 추가/수정 다이얼로그 */}
      <MemoAdd
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open)
          if (!open) setEditingMemo(null)
        }}
        onAddMemo={addMemo}
        editingMemo={editingMemo}
      />

      {/* 메모 상세보기 다이얼로그 */}
      <MemoDetail
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        memo={selectedMemo}
      />
    </div>
  )
}

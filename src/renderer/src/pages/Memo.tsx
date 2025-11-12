import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Plus, FileText } from 'lucide-react'
import { MemoAdd } from './MemoAdd'
import { MemoDetail } from './MemoDetail'
import { MemoCard } from '../components/memo'
import { useMemos } from '../hooks/useMemos'
import { useDeleteAnimation } from '../hooks/useDeleteAnimation'
import type { Memo } from '../hooks/useMemos'

interface MemoProps {
  onDialogChange?: (isOpen: boolean) => void
}

export default function Memo({ onDialogChange }: MemoProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)

  const { memos, addMemo, deleteMemo } = useMemos()
  const { deletingItems, deleteWithAnimation } = useDeleteAnimation<number>()

  // Notify parent when dialog state changes
  useState(() => {
    onDialogChange?.(showAddDialog || showDetailDialog)
  })

  const handleAddMemo = async (memo: { content: string }) => {
    await addMemo(memo, editingMemo)
    setEditingMemo(null)
  }

  const startEditMemo = (memo: Memo, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingMemo(memo)
    setShowAddDialog(true)
    setShowDetailDialog(false)
  }

  const handleDeleteMemo = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteWithAnimation(id, deleteMemo)
  }

  const openMemoDetail = (memo: Memo) => {
    setSelectedMemo(memo)
    setShowDetailDialog(true)
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
              <Button onClick={() => setShowAddDialog(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md transition-all duration-200">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memos.map((memo) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                isDeleting={deletingItems.has(memo.id)}
                onClick={() => openMemoDetail(memo)}
                onEdit={(e) => startEditMemo(memo, e)}
                onDelete={(e) => handleDeleteMemo(memo.id, e)}
              />
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
          onDialogChange?.(open)
          if (!open) setEditingMemo(null)
        }}
        onAddMemo={handleAddMemo}
        editingMemo={editingMemo}
      />

      {/* 메모 상세보기 다이얼로그 */}
      <MemoDetail
        open={showDetailDialog}
        onOpenChange={(open) => {
          setShowDetailDialog(open)
          onDialogChange?.(open)
        }}
        memo={selectedMemo}
      />
    </div>
  )
}
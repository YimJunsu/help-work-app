import { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { FileText } from 'lucide-react'
import { MemoAdd } from './MemoAdd'
import { MemoDetail } from './MemoDetail'
import { MemoCard } from '../components/memo'
import { useMemos } from '../hooks/useMemos'
import { useDeleteAnimation } from '../hooks/useDeleteAnimation'
import type { Memo } from '../hooks/useMemos'

interface MemoProps {
  onDialogChange?: (isOpen: boolean) => void
  onCountChange?: (count: number) => void
}

const Memo = forwardRef<{ openAddDialog: () => void }, MemoProps>(function Memo({ onDialogChange, onCountChange }, ref) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)

  const { memos, addMemo, deleteMemo } = useMemos()
  const { deletingItems, deleteWithAnimation } = useDeleteAnimation<number>()

  // Notify parent when dialog state changes
  useEffect(() => {
    onDialogChange?.(showAddDialog || showDetailDialog)
  }, [showAddDialog, showDetailDialog, onDialogChange])

  const handleAddMemo = useCallback(async (memo: { content: string }) => {
    await addMemo(memo, editingMemo)
    setEditingMemo(null)
  }, [addMemo, editingMemo])

  const startEditMemo = useCallback((memo: Memo, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingMemo(memo)
    setShowAddDialog(true)
    setShowDetailDialog(false)
  }, [])

  const handleDeleteMemo = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteWithAnimation(id, deleteMemo)
  }, [deleteWithAnimation, deleteMemo])

  const openMemoDetail = useCallback((memo: Memo) => {
    setSelectedMemo(memo)
    setShowDetailDialog(true)
  }, [])

  const memoCount = useMemo(() => memos.length, [memos])

  // Notify parent when count changes
  useEffect(() => {
    onCountChange?.(memoCount)
  }, [memoCount, onCountChange])

  // Expose openAddDialog to parent
  useImperativeHandle(ref, () => ({
    openAddDialog: () => setShowAddDialog(true)
  }))

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-2 pt-2">
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
})

export default Memo

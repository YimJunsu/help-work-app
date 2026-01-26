/**
 * Memo Component
 *
 * 메모 관리 페이지
 * - 메모 추가/수정/삭제
 * - Rich Text Editor 지원
 * - 카드 그리드 레이아웃
 * - 메모 상세 보기
 *
 * Features:
 * - 반응형 그리드 (1-3열)
 * - 부드러운 애니메이션
 * - Empty State 디자인
 * - 마크다운 미리보기
 */

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
  /* ============================================
     State Management
     ============================================ */

  // 다이얼로그 상태
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // 선택/편집 상태
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)

  // 커스텀 훅
  const { memos, addMemo, deleteMemo } = useMemos()
  const { deletingItems, deleteWithAnimation } = useDeleteAnimation<number>()

  /* ============================================
     Effects
     ============================================ */

  /**
   * 다이얼로그 상태 변경 알림 (부모 컴포넌트)
   */
  useEffect(() => {
    onDialogChange?.(showAddDialog || showDetailDialog)
  }, [showAddDialog, showDetailDialog, onDialogChange])

  /* ============================================
     Handlers
     ============================================ */

  /**
   * 메모 추가/수정 핸들러
   */
  const handleAddMemo = useCallback(async (memo: { content: string }) => {
    await addMemo(memo, editingMemo)
    setEditingMemo(null)
  }, [addMemo, editingMemo])

  /**
   * 메모 수정 시작
   */
  const startEditMemo = useCallback((memo: Memo, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingMemo(memo)
    setShowAddDialog(true)
    setShowDetailDialog(false)
  }, [])

  /**
   * 메모 삭제 (애니메이션 포함)
   */
  const handleDeleteMemo = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteWithAnimation(id, deleteMemo)
  }, [deleteWithAnimation, deleteMemo])

  /**
   * 메모 상세보기 열기
   */
  const openMemoDetail = useCallback((memo: Memo) => {
    setSelectedMemo(memo)
    setShowDetailDialog(true)
  }, [])

  /* ============================================
     Computed Values
     ============================================ */

  /**
   * 메모 개수
   */
  const memoCount = useMemo(() => memos.length, [memos])

  /**
   * 메모 개수 변경 알림 (부모 컴포넌트)
   */
  useEffect(() => {
    onCountChange?.(memoCount)
  }, [memoCount, onCountChange])

  /**
   * Ref를 통해 부모에서 다이얼로그 열기 기능 노출
   */
  useImperativeHandle(ref, () => ({
    openAddDialog: () => setShowAddDialog(true)
  }))

  /* ============================================
     Render
     ============================================ */

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-2 pt-2">
          {/* 헤더는 비워두고 필요시 추가 가능 */}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 메모 카드 그리드 */}
          {/* 반응형: xl 3열, md 2열, 기본 1열 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {memos.map((memo, index) => (
              <div
                key={memo.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <MemoCard
                  memo={memo}
                  isDeleting={deletingItems.has(memo.id)}
                  onClick={() => openMemoDetail(memo)}
                  onEdit={(e) => startEditMemo(memo, e)}
                  onDelete={(e) => handleDeleteMemo(memo.id, e)}
                />
              </div>
            ))}
          </div>

          {/* Empty State - 메모가 없을 때 */}
          {memos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
              {/* 아이콘 배경 효과 */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-8 rounded-3xl border-2 border-primary/20 backdrop-blur-sm">
                  <FileText className="w-16 h-16 mx-auto text-primary/40" strokeWidth={1.5} />
                </div>
              </div>

              {/* 안내 텍스트 */}
              <div className="mt-8 text-center space-y-2">
                <p className="text-lg font-semibold text-foreground/70">메모가 없습니다</p>
                <p className="text-sm text-muted-foreground">
                  새로운 메모를 추가해보세요!
                </p>
              </div>
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

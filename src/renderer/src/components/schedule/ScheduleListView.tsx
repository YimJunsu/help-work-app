import { List as ListIcon } from 'lucide-react'
import { ScheduleItem } from './ScheduleItem'
import type { Schedule } from '../../hooks/useSchedules'

interface ScheduleListViewProps {
  schedules: Schedule[]
  deletingSchedules: Set<number>
  draggedSchedule: number | null
  sortByLatest: boolean
  selectedCategory: string | null
  onToggle: (id: number) => void
  onEdit: (schedule: Schedule) => void
  onDelete: (id: number) => void
  onDragStart: (e: React.DragEvent, id: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, id: number) => void
  onDragEnd: () => void
}

export function ScheduleListView({
  schedules,
  deletingSchedules,
  draggedSchedule,
  sortByLatest,
  selectedCategory,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: ScheduleListViewProps) {
  if (schedules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ListIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">{selectedCategory ? '해당 카테고리에 일정이 없습니다' : '일정이 없습니다'}</p>
        <p className="text-sm">새로운 일정을 추가해보세요</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {schedules.map((schedule) => (
        <ScheduleItem
          key={schedule.id}
          schedule={schedule}
          isDeleting={deletingSchedules.has(schedule.id)}
          isDragging={draggedSchedule === schedule.id}
          sortByLatest={sortByLatest}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  )
}
import { Card, CardContent } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Calendar as CalendarIcon, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Schedule } from '../../hooks/useSchedules'
import { getCategoryColor, getCategoryLabel, getDDayStatus } from '../../utils/scheduleUtils'

interface ScheduleItemProps {
  schedule: Schedule
  isDeleting: boolean
  isDragging: boolean
  sortByLatest: boolean
  onToggle: (id: number) => void
  onEdit: (schedule: Schedule) => void
  onDelete: (id: number) => void
  onDragStart: (e: React.DragEvent, id: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, id: number) => void
  onDragEnd: () => void
}

export function ScheduleItem({
  schedule,
  isDeleting,
  isDragging,
  sortByLatest,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: ScheduleItemProps) {
  const ddayStatus = getDDayStatus(schedule.dueDate)

  return (
    <Card
      draggable={!sortByLatest}
      onDragStart={(e) => onDragStart(e, schedule.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, schedule.id)}
      onDragEnd={onDragEnd}
      className={`border border-border bg-card/70 backdrop-blur-sm hover:shadow-md transition-all duration-300 ${!sortByLatest ? 'cursor-move' : ''} ${
        isDeleting
          ? 'transform -translate-x-full opacity-0'
          : 'transform translate-x-0 opacity-100'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={Boolean(schedule.completed)}
            onCheckedChange={() => onToggle(schedule.id)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <div className="flex-1 min-w-0">
            <div className={`text-sm transition-all duration-200 ${schedule.completed ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
              {schedule.clientName && (
                <>
                  <span className="font-bold">{schedule.clientName}</span>
                  <span className="font-medium"> - {schedule.text}</span>
                </>
              )}
              {!schedule.clientName && (
                <span className="font-medium">{schedule.text}</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {schedule.category && (
                <Badge variant="secondary" className={`text-xs ${getCategoryColor(schedule.category)}`}>
                  {getCategoryLabel(schedule.category)}
                </Badge>
              )}
              {schedule.dueDate && (
                <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground border-border">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {format(new Date(schedule.dueDate), "MM/dd", { locale: ko })}
                </Badge>
              )}
              {schedule.category === 'reflect' && (
                <Badge variant="outline" className={`text-xs ${(schedule.webData === 1 || schedule.webData === true) ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700' : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-700'}`}>
                  {(schedule.webData === 1 || schedule.webData === true) ? 'O' : 'X'}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(schedule)}
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(schedule.id)}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          {ddayStatus && (
            <div className={`relative ${ddayStatus === 'dday' ? 'animate-bounce' : ''}`}>
              {ddayStatus === 'dday' && (
                <div className="absolute inset-0 animate-ping">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
              )}
              <AlertCircle
                className={`w-4 h-4 relative ${
                  ddayStatus === 'dday'
                    ? 'text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]'
                    : ddayStatus === 'tomorrow'
                    ? 'text-orange-500 drop-shadow-[0_0_4px_rgba(249,115,22,0.6)]'
                    : 'text-green-500'
                }`}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
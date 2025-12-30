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
      draggable={false}
      onDragStart={(e) => onDragStart(e, schedule.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, schedule.id)}
      onDragEnd={onDragEnd}
      className={`group relative overflow-hidden border-l-4 transition-all duration-300 ${
        schedule.completed
          ? 'border-l-muted bg-muted/30 hover:bg-muted/40'
          : ddayStatus === 'dday'
          ? 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20 hover:shadow-lg hover:shadow-red-500/10'
          : ddayStatus === 'tomorrow'
          ? 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20 hover:shadow-lg hover:shadow-orange-500/10'
          : 'border-l-primary bg-card hover:shadow-lg'
      } ${
        isDeleting
          ? 'transform -translate-x-full opacity-0'
          : 'transform translate-x-0 opacity-100'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="pt-0.5">
            <Checkbox
              checked={Boolean(schedule.completed)}
              onCheckedChange={() => onToggle(schedule.id)}
              className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title */}
            {schedule.requestNumber ? (
              <button
                onClick={() => {
                  if (window.electron && schedule.requestNumber) {
                    const url = `https://114.unipost.co.kr/home.uni?access=list&srIdx=${schedule.requestNumber}`
                    window.electron.ipcRenderer.send('open-external', url)
                  }
                }}
                className={`font-medium transition-all duration-200 text-left hover:text-primary hover:underline cursor-pointer ${
                  schedule.completed
                    ? 'line-through text-muted-foreground'
                    : 'text-foreground'
                }`}
              >
                {schedule.clientName && (
                  <>
                    <span className="font-bold text-primary">{schedule.clientName}</span>
                    <span className="text-muted-foreground mx-1.5">·</span>
                  </>
                )}
                <span>{schedule.text}</span>
              </button>
            ) : (
              <div className={`font-medium transition-all duration-200 ${
                schedule.completed
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground'
              }`}>
                {schedule.clientName && (
                  <>
                    <span className="font-bold text-primary">{schedule.clientName}</span>
                    <span className="text-muted-foreground mx-1.5">·</span>
                  </>
                )}
                <span>{schedule.text}</span>
              </div>
            )}

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-1.5">
              {schedule.requestNumber && (
                <button
                  onClick={() => {
                    if (window.electron && schedule.requestNumber) {
                      const url = `https://114.unipost.co.kr/home.uni?access=list&srIdx=${schedule.requestNumber}`
                      window.electron.ipcRenderer.send('open-external', url)
                    }
                  }}
                  className="hover:opacity-70 transition-opacity"
                >
                  <Badge
                    variant="outline"
                    className="text-xs font-medium bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800 cursor-pointer"
                  >
                    #{schedule.requestNumber}
                  </Badge>
                </button>
              )}

              {schedule.category && (
                <Badge
                  variant="secondary"
                  className={`text-xs font-medium ${getCategoryColor(schedule.category)}`}
                >
                  {getCategoryLabel(schedule.category)}
                </Badge>
              )}

              {schedule.dueDate && (
                <Badge
                  variant="outline"
                  className={`text-xs font-medium flex items-center gap-1 ${
                    ddayStatus === 'dday'
                      ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-700'
                      : ddayStatus === 'tomorrow'
                        ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-700'
                        : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                  }`}
                >
                  <CalendarIcon className="w-3 h-3" />
                  {format(new Date(schedule.dueDate), "MM/dd", { locale: ko })}
                </Badge>
              )}

              {schedule.category === 'reflect' && (
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${
                    (schedule.webData === 1 || schedule.webData === true)
                      ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700'
                      : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-700'
                  }`}
                >
                  {(schedule.webData === 1 || schedule.webData === true) ? 'WebData O' : 'WebData X'}
                </Badge>
              )}
            </div>
          </div>

          {/* Right Side: D-Day Alert & Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {ddayStatus && (
              <div className={`relative ${ddayStatus === 'dday' ? 'animate-bounce' : ''}`}>
                {ddayStatus === 'dday' && (
                  <div className="absolute inset-0 animate-ping">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                )}
                <AlertCircle
                  className={`w-5 h-5 relative ${
                    ddayStatus === 'dday'
                      ? 'text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]'
                      : ddayStatus === 'tomorrow'
                      ? 'text-orange-500 drop-shadow-[0_0_4px_rgba(249,115,22,0.6)]'
                      : 'text-green-500'
                  }`}
                />
              </div>
            )}

            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(schedule)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(schedule.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

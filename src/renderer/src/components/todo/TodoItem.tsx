import { Card, CardContent } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import type { Todo } from '../../hooks/useTodos'

interface TodoItemProps {
  todo: Todo
  isDeleting: boolean
  isDragging: boolean
  onToggle: (id: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
}

export function TodoItem({
  todo,
  isDeleting,
  isDragging,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: TodoItemProps) {
  const priorityConfig = {
    A: {
      border: 'border-l-red-500',
      bg: 'bg-red-500/5 dark:bg-red-500/10',
      badge: 'bg-gradient-to-br from-red-500/30 to-red-600/20 border-red-500/50 text-red-700 dark:text-red-400',
      shadow: 'hover:shadow-red-500/10'
    },
    B: {
      border: 'border-l-orange-500',
      bg: 'bg-orange-500/5 dark:bg-orange-500/10',
      badge: 'bg-gradient-to-br from-orange-500/30 to-orange-600/20 border-orange-500/50 text-orange-700 dark:text-orange-400',
      shadow: 'hover:shadow-orange-500/10'
    },
    C: {
      border: 'border-l-blue-500',
      bg: 'bg-blue-500/5 dark:bg-blue-500/10',
      badge: 'bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-blue-500/50 text-blue-700 dark:text-blue-400',
      shadow: 'hover:shadow-blue-500/10'
    }
  }

  const config = priorityConfig[todo.priority]

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, todo.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, todo.id)}
      onDragEnd={onDragEnd}
      className={`group relative overflow-hidden rounded-2xl border-2 border-l-[6px] ${config.border} ${config.bg} backdrop-blur-sm hover:shadow-xl ${config.shadow} transition-all duration-300 cursor-move ${
        isDeleting
          ? 'transform -translate-x-full opacity-0'
          : 'transform translate-x-0 opacity-100'
      } ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'} ${todo.completed ? 'opacity-60' : ''}`}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <CardContent className="relative p-5">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <div className="pt-0.5">
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => onToggle(todo.id)}
              className="h-5 w-5 rounded-lg border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <p className={`text-base font-medium leading-snug transition-all duration-300 ${
              todo.completed
                ? 'line-through text-muted-foreground/60'
                : 'text-foreground'
            }`}>
              {todo.text}
            </p>

            {todo.category && (
              <Badge
                variant="secondary"
                className="text-xs font-medium px-3 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 backdrop-blur-sm"
              >
                {todo.category}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Priority Badge */}
            <Badge
              variant="outline"
              className={`text-xs font-bold px-3 py-1 rounded-lg border-2 shadow-sm ${config.badge}`}
            >
              {todo.priority}
            </Badge>

            {/* Edit Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(todo)}
              className="h-9 w-9 p-0 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/15 active:scale-95 transition-all"
            >
              <Pencil className="w-4 h-4" />
            </Button>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(todo.id)}
              className="h-9 w-9 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/15 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
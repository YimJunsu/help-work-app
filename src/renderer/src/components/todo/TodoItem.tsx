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
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, todo.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, todo.id)}
      onDragEnd={onDragEnd}
      className={`border border-border bg-card/70 backdrop-blur-sm hover:shadow-md transition-all duration-300 cursor-move ${
        isDeleting
          ? 'transform -translate-x-full opacity-0'
          : 'transform translate-x-0 opacity-100'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={() => onToggle(todo.id)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-medium transition-all duration-200 ${todo.completed ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
              {todo.text}
            </span>
            {todo.category && (
              <div className="mt-1">
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                  {todo.category}
                </Badge>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(todo)}
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(todo.id)}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
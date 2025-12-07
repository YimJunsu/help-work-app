import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { FileText, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Memo } from '../../hooks/useMemos'
import { sanitizeHtml } from '../../lib/sanitize'

interface MemoCardProps {
  memo: Memo
  isDeleting: boolean
  onClick: () => void
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}

export function MemoCard({ memo, isDeleting, onClick, onEdit, onDelete }: MemoCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`border border-border bg-card/70 backdrop-blur-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer group ${
        isDeleting
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
                onClick={onEdit}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-[60px]">
            <div
              className="text-sm text-card-foreground line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(memo.content) }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
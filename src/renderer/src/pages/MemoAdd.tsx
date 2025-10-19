import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2, Code } from 'lucide-react'

interface MemoAddProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddMemo: (memo: { content: string }) => void
  editingMemo?: { content: string } | null
}

export function MemoAdd({ open, onOpenChange, onAddMemo, editingMemo }: MemoAddProps) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: editingMemo?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4'
      }
    }
  })

  // Update editor content when editingMemo changes
  useEffect(() => {
    if (editor && open) {
      if (editingMemo) {
        editor.commands.setContent(editingMemo.content)
      } else {
        editor.commands.setContent('')
      }
    }
  }, [editingMemo, open, editor])

  const handleAdd = () => {
    if (!editor) return

    const html = editor.getHTML()
    const text = editor.getText()

    if (!text.trim()) {
      setAlertMessage("내용을 입력해주세요.")
      return
    }

    onAddMemo({
      content: html
    })

    // Reset form
    editor.commands.setContent('')
    setAlertMessage(null)
    onOpenChange(false)
  }

  const handleCancel = () => {
    if (editor) {
      editor.commands.setContent('')
    }
    setAlertMessage(null)
    onOpenChange(false)
  }

  if (!editor) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-background/95 backdrop-blur-md border-2 shadow-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editingMemo ? 'Edit Memo' : 'Add Memo'}
          </DialogTitle>
          <DialogDescription>
            {editingMemo ? '메모를 수정하세요.' : '새로운 메모를 추가하세요.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {alertMessage && (
            <Alert variant="destructive">
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">내용</label>

            {/* Toolbar */}
            <div className="border rounded-t-md border-border bg-muted/30 p-2 flex flex-wrap gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'bg-accent' : ''}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'bg-accent' : ''}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={editor.isActive('underline') ? 'bg-accent' : ''}
              >
                <UnderlineIcon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={editor.isActive('code') ? 'bg-accent' : ''}
              >
                <Code className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
              >
                <Heading2 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'bg-accent' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'bg-accent' : ''}
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
            </div>

            {/* Editor */}
            <div className="border border-t-0 rounded-b-md border-border bg-background">
              <EditorContent editor={editor} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              취소
            </Button>
            <Button onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editingMemo ? '수정' : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
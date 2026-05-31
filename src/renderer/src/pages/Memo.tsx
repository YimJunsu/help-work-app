import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  StickyNote,
  Loader2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Search,
  X,
  Table as TableIcon,
  Rows,
  Columns3,
  Check,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import DOMPurify from "dompurify";

interface Memo {
  id: number;
  title: string;
  content: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// 색상 팔레트 (Notion 스타일)
const MEMO_COLORS = [
  {
    id: "yellow",
    label: "노랑",
    swatch: "#fef3c7",
    bg: "bg-yellow-100 dark:bg-yellow-900/40",
    border: "border-yellow-200 dark:border-yellow-800/50",
    header: "bg-yellow-200/60 dark:bg-yellow-800/40",
    accent: "text-yellow-700 dark:text-yellow-300",
  },
  {
    id: "pink",
    label: "분홍",
    swatch: "#fce7f3",
    bg: "bg-pink-100 dark:bg-pink-900/40",
    border: "border-pink-200 dark:border-pink-800/50",
    header: "bg-pink-200/60 dark:bg-pink-800/40",
    accent: "text-pink-700 dark:text-pink-300",
  },
  {
    id: "blue",
    label: "파랑",
    swatch: "#dbeafe",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    border: "border-blue-200 dark:border-blue-800/50",
    header: "bg-blue-200/60 dark:bg-blue-800/40",
    accent: "text-blue-700 dark:text-blue-300",
  },
  {
    id: "green",
    label: "초록",
    swatch: "#dcfce7",
    bg: "bg-green-100 dark:bg-green-900/40",
    border: "border-green-200 dark:border-green-800/50",
    header: "bg-green-200/60 dark:bg-green-800/40",
    accent: "text-green-700 dark:text-green-300",
  },
  {
    id: "purple",
    label: "보라",
    swatch: "#f3e8ff",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    border: "border-purple-200 dark:border-purple-800/50",
    header: "bg-purple-200/60 dark:bg-purple-800/40",
    accent: "text-purple-700 dark:text-purple-300",
  },
  {
    id: "orange",
    label: "주황",
    swatch: "#fed7aa",
    bg: "bg-orange-100 dark:bg-orange-900/40",
    border: "border-orange-200 dark:border-orange-800/50",
    header: "bg-orange-200/60 dark:bg-orange-800/40",
    accent: "text-orange-700 dark:text-orange-300",
  },
  {
    id: "gray",
    label: "회색",
    swatch: "#f3f4f6",
    bg: "bg-gray-100 dark:bg-gray-800/40",
    border: "border-gray-200 dark:border-gray-700/50",
    header: "bg-gray-200/60 dark:bg-gray-700/40",
    accent: "text-gray-700 dark:text-gray-300",
  },
  {
    id: "red",
    label: "빨강",
    swatch: "#fee2e2",
    bg: "bg-red-100 dark:bg-red-900/40",
    border: "border-red-200 dark:border-red-800/50",
    header: "bg-red-200/60 dark:bg-red-800/40",
    accent: "text-red-700 dark:text-red-300",
  },
];

function getMemoColor(colorId?: string | null, fallbackIndex?: number) {
  if (colorId) {
    const found = MEMO_COLORS.find((c) => c.id === colorId);
    if (found) return found;
  }
  // 색상 미지정 시 인덱스 기반 순환
  const idx = (fallbackIndex ?? 0) % MEMO_COLORS.length;
  return MEMO_COLORS[idx];
}

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day} ${h}:${min}`;
}

// 색상 선택 팔레트 컴포넌트
function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-muted-foreground mr-0.5">배경색</span>
      {MEMO_COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          title={color.label}
          onClick={() => onChange(color.id)}
          className={cn(
            "relative h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
            value === color.id
              ? "border-foreground/60 scale-110"
              : "border-transparent",
          )}
          style={{ backgroundColor: color.swatch }}
        >
          {value === color.id && (
            <Check className="absolute inset-0 m-auto h-2.5 w-2.5 text-foreground/60" />
          )}
        </button>
      ))}
    </div>
  );
}

// Tiptap 에디터 툴바
function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const isInTable = editor.isActive("table");

  const btnClass = (active: boolean) =>
    cn(
      "h-7 w-7 rounded-md flex items-center justify-center transition-all",
      active
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
    );

  return (
    <div className="flex items-center gap-0.5 p-1.5 border-b border-border/40 bg-muted/20 rounded-t-xl flex-wrap">
      {/* 텍스트 서식 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive("bold"))}
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive("italic"))}
      >
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive("underline"))}
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive("strike"))}
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-4 bg-border/50 mx-1" />

      {/* 리스트 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive("bulletList"))}
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive("orderedList"))}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-4 bg-border/50 mx-1" />

      {/* 표 */}
      {!isInTable ? (
        <button
          type="button"
          title="표 삽입"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className={btnClass(false)}
        >
          <TableIcon className="h-3.5 w-3.5" />
        </button>
      ) : (
        <>
          <button
            type="button"
            title="행 추가"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className={btnClass(false)}
          >
            <Rows className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="열 추가"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className={btnClass(false)}
          >
            <Columns3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="행 삭제"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className={cn(btnClass(false), "text-destructive/70 hover:text-destructive")}
          >
            <Rows className="h-3.5 w-3.5 line-through opacity-60" />
          </button>
          <button
            type="button"
            title="열 삭제"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className={cn(btnClass(false), "text-destructive/70 hover:text-destructive")}
          >
            <Columns3 className="h-3.5 w-3.5 opacity-60" />
          </button>
          <button
            type="button"
            title="표 삭제"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className={cn(btnClass(false), "text-destructive hover:bg-destructive/10")}
          >
            <TableIcon className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      <div className="w-px h-4 bg-border/50 mx-1" />

      {/* 실행취소/재실행 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={cn(btnClass(false), "disabled:opacity-30")}
      >
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={cn(btnClass(false), "disabled:opacity-30")}
      >
        <Redo2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// 메모 에디터 다이얼로그
type DialogMode = "create" | "edit" | "view";

function MemoEditorDialog({
  open,
  onOpenChange,
  onSave,
  onEditRequest,
  initialTitle,
  initialContent,
  initialColor,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (title: string, content: string, color: string) => void;
  onEditRequest?: () => void;
  initialTitle?: string;
  initialContent?: string;
  initialColor?: string;
  mode: DialogMode;
}) {
  const [title, setTitle] = useState(initialTitle || "");
  const [selectedColor, setSelectedColor] = useState(initialColor || "yellow");
  const readOnly = mode === "view";

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent || "",
    editable: !readOnly,
    immediatelyRender: false,
    autofocus: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-3 py-2 text-[13px]",
          readOnly && "cursor-default",
        ),
      },
    },
  });

  useEffect(() => {
    if (open && editor) {
      setTitle(initialTitle || "");
      setSelectedColor(initialColor || "yellow");
      editor.commands.setContent(initialContent || "");
      editor.setEditable(!readOnly);
    }
  }, [open, initialTitle, initialContent, initialColor, editor, readOnly]);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !onSave) return;
    const html = editor?.getHTML() || "";
    const sanitized = DOMPurify.sanitize(html, {
      ADD_TAGS: ["table", "thead", "tbody", "tr", "th", "td", "colgroup", "col"],
      ADD_ATTR: ["colspan", "rowspan", "style", "class"],
    });
    onSave(trimmedTitle, sanitized, selectedColor);
    onOpenChange(false);
  };

  const dialogTitle = {
    create: "새 메모 작성",
    edit: "메모 수정",
    view: "메모 상세보기",
  }[mode];

  const dialogDesc = {
    create: "새로운 메모의 제목과 내용을 입력하세요.",
    edit: "메모의 제목과 내용을 수정하세요.",
    view: "",
  }[mode];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] rounded-2xl p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle className="text-[15px]">{dialogTitle}</DialogTitle>
          {dialogDesc && (
            <DialogDescription className="text-[12px] text-muted-foreground">
              {dialogDesc}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="px-6 space-y-3 py-4 flex-1 overflow-y-auto min-h-0 scrollbar-thin">
          {readOnly ? (
            <div className="h-10 flex items-center text-[14px] font-semibold px-1 shrink-0">
              {title || "제목 없음"}
            </div>
          ) : (
            <>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="메모 제목"
                className="h-10 text-[13px] border-border/50 bg-muted/20 rounded-xl px-3.5 focus-visible:ring-1 focus-visible:ring-primary/30 shrink-0"
              />
              {/* 배경색 선택 */}
              <div className="px-0.5">
                <ColorPicker value={selectedColor} onChange={setSelectedColor} />
              </div>
            </>
          )}

          <div className="rounded-xl border border-border/50 overflow-hidden bg-background memo-editor-wrap">
            {!readOnly && editor && <EditorToolbar editor={editor} />}
            {editor && <EditorContent editor={editor} />}
          </div>
        </div>

        <DialogFooter className="px-6 pb-5 pt-3 shrink-0 border-t border-border/30">
          {readOnly ? (
            <>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-[12px] h-9"
              >
                닫기
              </Button>
              {onEditRequest && (
                <Button
                  onClick={onEditRequest}
                  className="rounded-xl text-[12px] h-9 bg-primary hover:bg-primary/90"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  수정
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-[12px] h-9"
              >
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={!title.trim()}
                className="rounded-xl text-[12px] h-9 bg-primary hover:bg-primary/90"
              >
                {mode === "edit" ? "수정" : "저장"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Memo() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewingMemo, setViewingMemo] = useState<Memo | null>(null);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const filteredMemos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return memos;
    return memos.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        stripHtml(m.content).toLowerCase().includes(q),
    );
  }, [memos, searchQuery]);

  const fetchMemos = useCallback(async () => {
    try {
      const data = await window.electron.ipcRenderer.invoke("memos:getAll");
      setMemos(data || []);
    } catch (err) {
      console.error("Failed to fetch memos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  const handleCreate = async (title: string, content: string, color: string) => {
    try {
      const created = await window.electron.ipcRenderer.invoke("memos:create", {
        title,
        content,
        color,
      });
      setMemos((prev) => [created, ...prev]);
    } catch (err) {
      console.error("Failed to create memo:", err);
    }
  };

  const handleUpdate = async (title: string, content: string, color: string) => {
    if (!editingMemo) return;
    try {
      const updated = await window.electron.ipcRenderer.invoke(
        "memos:update",
        editingMemo.id,
        { title, content, color },
      );
      setMemos((prev) => prev.map((m) => (m.id === editingMemo.id ? updated : m)));
      setEditingMemo(null);
    } catch (err) {
      console.error("Failed to update memo:", err);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) => window.electron.ipcRenderer.invoke("memos:delete", id)),
      );
      setMemos((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error("Failed to delete memos:", err);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleEditSelected = () => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    const memo = memos.find((m) => m.id === id);
    if (memo) setEditingMemo(memo);
  };

  const handleCardClick = (memo: Memo) => {
    setViewingMemo(memo);
  };

  const handleViewToEdit = () => {
    if (viewingMemo) {
      setEditingMemo(viewingMemo);
      setViewingMemo(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* ── 상단 헤더 ── */}
      <div className="flex-shrink-0 space-y-3 px-6 pt-2 pb-4">
        <div className="flex items-center justify-between min-h-9">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <StickyNote className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold leading-none">나의 메모</h2>
              <p className="text-[10px] text-muted-foreground mt-1">
                {searchQuery.trim()
                  ? `${filteredMemos.length}개 검색됨 / 전체 ${memos.length}개`
                  : `총 ${memos.length}개`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-xl transition-all",
                selectedIds.size === 1
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground/30 cursor-not-allowed",
              )}
              disabled={selectedIds.size !== 1}
              onClick={handleEditSelected}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-xl transition-all",
                selectedIds.size > 0
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-muted-foreground/30 cursor-not-allowed",
              )}
              disabled={selectedIds.size === 0}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 검색 입력창 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목 또는 내용으로 검색..."
            className="h-8 pl-8 pr-8 text-[12px] border-border/40 bg-muted/20 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── 메모 그리드 ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-stable">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/30" />
          </div>
        ) : memos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
              <StickyNote className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-[13px] text-muted-foreground/60 font-medium">
              메모가 없습니다
            </p>
            <p className="text-[11px] text-muted-foreground/40 mt-1">
              + 버튼을 눌러 새 메모를 추가하세요
            </p>
          </div>
        ) : filteredMemos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-[13px] text-muted-foreground/60 font-medium">
              검색 결과가 없습니다
            </p>
            <p className="text-[11px] text-muted-foreground/40 mt-1">
              다른 검색어를 입력해 보세요
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMemos.map((memo, index) => {
              const color = getMemoColor(memo.color, index);
              const isSelected = selectedIds.has(memo.id);
              const plainText = stripHtml(memo.content);

              return (
                <div
                  key={memo.id}
                  onClick={() => handleCardClick(memo)}
                  className={cn(
                    "relative flex flex-col rounded-2xl border transition-colors duration-150 cursor-pointer select-none",
                    color.bg,
                    color.border,
                  )}
                  style={{ minHeight: "160px" }}
                >
                  {/* 체크박스 */}
                  <div
                    className="absolute top-2.5 right-2.5 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(memo.id)}
                      className="h-4 w-4 rounded-[4px] border-2 border-muted-foreground/30"
                    />
                  </div>

                  {/* 포스트잇 헤더 */}
                  <div className={cn("px-3.5 py-2.5 rounded-t-[14px]", color.header)}>
                    <h3 className={cn("text-[12px] font-bold truncate pr-5", color.accent)}>
                      {memo.title || "제목 없음"}
                    </h3>
                  </div>

                  {/* 내용 미리보기 */}
                  <div className="flex-1 px-3.5 py-2.5 overflow-hidden">
                    <p className="text-[11px] text-foreground/70 leading-relaxed line-clamp-5">
                      {plainText || "내용 없음"}
                    </p>
                  </div>

                  {/* 날짜 */}
                  <div className="px-3.5 pb-2.5">
                    <p className="text-[9px] text-muted-foreground/50 font-medium">
                      {formatDate(memo.updatedAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 새 메모 생성 다이얼로그 ── */}
      {createDialogOpen && (
        <MemoEditorDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSave={handleCreate}
          mode="create"
        />
      )}

      {/* ── 상세보기 다이얼로그 ── */}
      {viewingMemo && (
        <MemoEditorDialog
          open={!!viewingMemo}
          onOpenChange={(open) => {
            if (!open) setViewingMemo(null);
          }}
          initialTitle={viewingMemo.title}
          initialContent={viewingMemo.content}
          initialColor={viewingMemo.color}
          onEditRequest={handleViewToEdit}
          mode="view"
        />
      )}

      {/* ── 수정 다이얼로그 ── */}
      {editingMemo && (
        <MemoEditorDialog
          open={!!editingMemo}
          onOpenChange={(open) => {
            if (!open) setEditingMemo(null);
          }}
          onSave={handleUpdate}
          initialTitle={editingMemo.title}
          initialContent={editingMemo.content}
          initialColor={editingMemo.color}
          mode="edit"
        />
      )}

      {/* ── 삭제 확인 다이얼로그 ── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">메모 삭제</DialogTitle>
            <DialogDescription className="text-[12px]">
              선택한 {selectedIds.size}개의 메모를 삭제하시겠습니까? 이 작업은
              되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-xl text-[12px] h-9"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              className="rounded-xl text-[12px] h-9"
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

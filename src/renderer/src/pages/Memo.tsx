import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus,
  Trash2,
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
  Check,
  ChevronLeft,
  ChevronDown,
  Minus,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "../components/ui/dropdown-menu";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
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

const MEMO_COLORS = [
  {
    id: "yellow",
    label: "노랑",
    swatch: "#fef3c7",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800/50",
    header: "bg-yellow-100/80 dark:bg-yellow-800/30",
    accent: "text-yellow-800 dark:text-yellow-300",
  },
  {
    id: "pink",
    label: "분홍",
    swatch: "#fce7f3",
    bg: "bg-pink-50 dark:bg-pink-900/20",
    border: "border-pink-200 dark:border-pink-800/50",
    header: "bg-pink-100/80 dark:bg-pink-800/30",
    accent: "text-pink-800 dark:text-pink-300",
  },
  {
    id: "blue",
    label: "파랑",
    swatch: "#dbeafe",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800/50",
    header: "bg-blue-100/80 dark:bg-blue-800/30",
    accent: "text-blue-800 dark:text-blue-300",
  },
  {
    id: "green",
    label: "초록",
    swatch: "#dcfce7",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800/50",
    header: "bg-green-100/80 dark:bg-green-800/30",
    accent: "text-green-800 dark:text-green-300",
  },
  {
    id: "purple",
    label: "보라",
    swatch: "#f3e8ff",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800/50",
    header: "bg-purple-100/80 dark:bg-purple-800/30",
    accent: "text-purple-800 dark:text-purple-300",
  },
  {
    id: "orange",
    label: "주황",
    swatch: "#fed7aa",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800/50",
    header: "bg-orange-100/80 dark:bg-orange-800/30",
    accent: "text-orange-800 dark:text-orange-300",
  },
  {
    id: "gray",
    label: "회색",
    swatch: "#f3f4f6",
    bg: "bg-gray-50 dark:bg-gray-800/20",
    border: "border-gray-200 dark:border-gray-700/50",
    header: "bg-gray-100/80 dark:bg-gray-700/30",
    accent: "text-gray-800 dark:text-gray-300",
  },
  {
    id: "red",
    label: "빨강",
    swatch: "#fee2e2",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800/50",
    header: "bg-red-100/80 dark:bg-red-800/30",
    accent: "text-red-800 dark:text-red-300",
  },
];

function getMemoColor(colorId?: string | null, fallbackIndex?: number) {
  if (colorId) {
    const found = MEMO_COLORS.find((c) => c.id === colorId);
    if (found) return found;
  }
  return MEMO_COLORS[(fallbackIndex ?? 0) % MEMO_COLORS.length];
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

function sanitizeContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["table", "thead", "tbody", "tr", "th", "td", "colgroup", "col"],
    ADD_ATTR: ["colspan", "rowspan", "style", "class"],
  });
}

function ColorPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {MEMO_COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          title={color.label}
          onClick={() => onChange(color.id)}
          className={cn(
            "relative h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
            value === color.id ? "border-foreground/60 scale-110" : "border-transparent",
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

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const isInTable = editor.isActive("table");
  const btn = (active: boolean) =>
    cn(
      "h-7 w-7 rounded-md flex items-center justify-center transition-all",
      active
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
    );

  return (
    <div className="flex items-center gap-0.5 p-1 flex-wrap">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))}>
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))}>
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))}>
        <UnderlineIcon className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive("strike"))}>
        <Strikethrough className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-4 bg-border/50 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))}>
        <List className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))}>
        <ListOrdered className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-4 bg-border/50 mx-1" />

      {/* 표 드롭다운 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "h-7 px-1.5 rounded-md flex items-center gap-0.5 transition-all text-[11px] font-medium",
              isInTable
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>표</span>
            <ChevronDown className="h-2.5 w-2.5 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 text-[12px]">
          {!isInTable ? (
            <>
              <DropdownMenuLabel className="text-[10px] text-muted-foreground py-1">표 삽입</DropdownMenuLabel>
              <DropdownMenuItem
                className="text-[12px] gap-2"
                onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}
              >
                <TableIcon className="h-3.5 w-3.5 opacity-50" />
                2 × 2
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[12px] gap-2"
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              >
                <TableIcon className="h-3.5 w-3.5 opacity-50" />
                3 × 3 (기본)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[12px] gap-2"
                onClick={() => editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run()}
              >
                <TableIcon className="h-3.5 w-3.5 opacity-50" />
                4 × 4
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuLabel className="text-[10px] text-muted-foreground py-1">행 관리</DropdownMenuLabel>
              <DropdownMenuItem
                className="text-[12px] gap-2"
                onClick={() => editor.chain().focus().addRowBefore().run()}
              >
                <Plus className="h-3.5 w-3.5 opacity-50" />
                위에 행 추가
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[12px] gap-2"
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                <Plus className="h-3.5 w-3.5 opacity-50" />
                아래에 행 추가
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[12px] gap-2 text-destructive focus:text-destructive"
                onClick={() => editor.chain().focus().deleteRow().run()}
              >
                <Minus className="h-3.5 w-3.5 opacity-50" />
                현재 행 삭제
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] text-muted-foreground py-1">열 관리</DropdownMenuLabel>
              <DropdownMenuItem
                className="text-[12px] gap-2"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
              >
                <Plus className="h-3.5 w-3.5 opacity-50" />
                왼쪽에 열 추가
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[12px] gap-2"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              >
                <Plus className="h-3.5 w-3.5 opacity-50" />
                오른쪽에 열 추가
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[12px] gap-2 text-destructive focus:text-destructive"
                onClick={() => editor.chain().focus().deleteColumn().run()}
              >
                <Minus className="h-3.5 w-3.5 opacity-50" />
                현재 열 삭제
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[12px] gap-2 text-destructive focus:text-destructive"
                onClick={() => editor.chain().focus().deleteTable().run()}
              >
                <Trash2 className="h-3.5 w-3.5 opacity-50" />
                표 전체 삭제
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-4 bg-border/50 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={cn(btn(false), "disabled:opacity-30")}>
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={cn(btn(false), "disabled:opacity-30")}>
        <Redo2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── 노션 스타일 메모 상세 패널 ──
function MemoDetailPanel({
  initialMemo,
  onBack,
  onCreateMemo,
  onUpdateMemo,
  onDeleteMemo,
}: {
  initialMemo: Memo | null;
  onBack: () => void;
  onCreateMemo: (title: string, content: string, color: string) => Promise<Memo>;
  onUpdateMemo: (id: number, title: string, content: string, color: string) => Promise<Memo>;
  onDeleteMemo: (id: number) => Promise<void>;
}) {
  const [title, setTitle] = useState(initialMemo?.title || "");
  const [selectedColor, setSelectedColor] = useState(initialMemo?.color || "yellow");
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [savedMemo, setSavedMemo] = useState<Memo | null>(initialMemo);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const savedMemoRef = useRef(savedMemo);
  useEffect(() => {
    savedMemoRef.current = savedMemo;
  }, [savedMemo]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialMemo?.content || "",
    editable: true,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: [
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-1 py-2 text-[13px] leading-relaxed",
          "[&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-[12px]",
          "[&_td]:border [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-1.5 [&_td]:align-top [&_td]:min-w-[60px]",
          "[&_th]:border [&_th]:border-border/60 [&_th]:px-3 [&_th]:py-1.5 [&_th]:bg-muted/50 [&_th]:font-semibold [&_th]:text-left",
          "[&_.selectedCell]:bg-primary/10",
        ].join(" "),
      },
    },
    onUpdate: () => {
      if (savedMemoRef.current) {
        setIsDirty(true);
      }
    },
  });

  // 자동 저장 (기존 메모만)
  useEffect(() => {
    if (!isDirty || !savedMemoRef.current) return;
    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      const html = editor?.getHTML() || "";
      const sanitized = sanitizeContent(html);
      try {
        const updated = await onUpdateMemo(
          savedMemoRef.current!.id,
          title || "제목 없음",
          sanitized,
          selectedColor,
        );
        setSavedMemo(updated);
        setIsDirty(false);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
      } catch {
        setSaveStatus("idle");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [isDirty, title, selectedColor, editor, onUpdateMemo]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (savedMemoRef.current) setIsDirty(true);
  };

  const handleColorChange = (colorId: string) => {
    setSelectedColor(colorId);
    if (savedMemoRef.current) setIsDirty(true);
  };

  const handleManualSave = async () => {
    if (!title.trim()) return;
    const html = editor?.getHTML() || "";
    const sanitized = sanitizeContent(html);
    setSaveStatus("saving");
    try {
      const created = await onCreateMemo(title.trim(), sanitized, selectedColor);
      setSavedMemo(created);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  };

  const handleBack = () => {
    if (isDirty && savedMemoRef.current) {
      const html = editor?.getHTML() || "";
      const sanitized = sanitizeContent(html);
      onUpdateMemo(savedMemoRef.current.id, title || "제목 없음", sanitized, selectedColor).catch(
        console.error,
      );
    }
    onBack();
  };

  const handleDelete = async () => {
    if (savedMemoRef.current) {
      await onDeleteMemo(savedMemoRef.current.id);
    }
    setDeleteConfirmOpen(false);
    onBack();
  };

  const isNew = !savedMemo;
  const color = getMemoColor(selectedColor);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* 상단 내비게이션 바 */}
      <div className="flex-shrink-0 h-11 px-4 border-b border-border/30 flex items-center justify-between bg-background/95 backdrop-blur-sm">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>메모 목록</span>
        </button>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-[11px] transition-opacity duration-300",
              saveStatus === "idle" ? "opacity-0" : "opacity-100",
              saveStatus === "saved" ? "text-green-500/80" : "text-muted-foreground/60",
            )}
          >
            {saveStatus === "saving" ? "저장 중..." : "저장됨"}
          </span>

          <ColorPicker value={selectedColor} onChange={handleColorChange} />

          {isNew ? (
            <Button
              size="sm"
              onClick={handleManualSave}
              disabled={!title.trim()}
              className="h-7 px-3 text-[11px] rounded-lg"
            >
              저장
            </Button>
          ) : (
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="메모 삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 메모 내용 영역 */}
      <div className={cn("flex-1 overflow-y-auto scrollbar-thin scrollbar-stable", color.bg)}>
        {/* 제목 */}
        <div className="px-8 pt-10 pb-2">
          <input
            value={title}
            onChange={handleTitleChange}
            placeholder="제목 없음"
            className={cn(
              "w-full bg-transparent border-none outline-none font-bold",
              "text-[26px] leading-tight tracking-tight",
              "placeholder:text-foreground/20",
              color.accent,
            )}
          />
        </div>

        {/* 메타데이터 */}
        {savedMemo && (
          <div className="px-8 pb-5 flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground/40">
              작성 {formatDate(savedMemo.createdAt)}
            </span>
            <span className="text-[10px] text-muted-foreground/20">·</span>
            <span className="text-[11px] text-muted-foreground/40">
              수정 {formatDate(savedMemo.updatedAt)}
            </span>
          </div>
        )}

        {/* 툴바 + 구분선 */}
        <div className="mx-6 border-t border-border/20 pt-1">
          <EditorToolbar editor={editor} />
        </div>

        {/* 에디터 */}
        <div className="px-8 pb-16 pt-2">
          {editor && <EditorContent editor={editor} />}
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">메모 삭제</DialogTitle>
            <DialogDescription className="text-[12px]">
              이 메모를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
              onClick={handleDelete}
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

// ── 메인 메모 컴포넌트 ──
export function Memo() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [view, setView] = useState<"list" | "detail">("list");
  const [detailMemo, setDetailMemo] = useState<Memo | null>(null);

  const filteredMemos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return memos;
    return memos.filter(
      (m) =>
        m.title.toLowerCase().includes(q) || stripHtml(m.content).toLowerCase().includes(q),
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

  const handleCreate = useCallback(
    async (title: string, content: string, color: string): Promise<Memo> => {
      const created = await window.electron.ipcRenderer.invoke("memos:create", {
        title,
        content,
        color,
      });
      setMemos((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  const handleUpdate = useCallback(
    async (id: number, title: string, content: string, color: string): Promise<Memo> => {
      const updated = await window.electron.ipcRenderer.invoke("memos:update", id, {
        title,
        content,
        color,
      });
      setMemos((prev) => prev.map((m) => (m.id === id ? updated : m)));
      return updated;
    },
    [],
  );

  const handleDelete = useCallback(async (id: number): Promise<void> => {
    await window.electron.ipcRenderer.invoke("memos:delete", id);
    setMemos((prev) => prev.filter((m) => m.id !== id));
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }, []);

  const handleDeleteSelected = async () => {
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map((id) => window.electron.ipcRenderer.invoke("memos:delete", id)));
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openDetail = (memo: Memo) => {
    setDetailMemo(memo);
    setView("detail");
  };

  const openNewMemo = () => {
    setDetailMemo(null);
    setView("detail");
  };

  const closeDetail = () => {
    setView("list");
    setDetailMemo(null);
  };

  // 상세 뷰
  if (view === "detail") {
    return (
      <MemoDetailPanel
        initialMemo={detailMemo}
        onBack={closeDetail}
        onCreateMemo={handleCreate}
        onUpdateMemo={handleUpdate}
        onDeleteMemo={handleDelete}
      />
    );
  }

  // 목록 뷰
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* 상단 헤더 */}
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
              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              onClick={openNewMemo}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 검색 */}
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

      {/* 메모 그리드 */}
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
            <p className="text-[13px] text-muted-foreground/60 font-medium">메모가 없습니다</p>
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
                  onClick={() => openDetail(memo)}
                  className={cn(
                    "relative flex flex-col rounded-2xl border transition-all duration-150 cursor-pointer select-none",
                    "hover:shadow-md hover:-translate-y-0.5",
                    color.bg,
                    color.border,
                    isSelected && "ring-2 ring-primary/40",
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

                  {/* 헤더 */}
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

      {/* 선택 삭제 확인 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">메모 삭제</DialogTitle>
            <DialogDescription className="text-[12px]">
              선택한 {selectedIds.size}개의 메모를 삭제하시겠습니까? 이 작업은 되돌릴 수
              없습니다.
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

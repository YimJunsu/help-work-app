import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  ListFilter,
  Loader2,
  Pencil,
  ListChecks,
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

interface Todo {
  id: number;
  text: string;
  completed: number;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

type Filter = "all" | "active" | "completed";
type Priority = "urgent" | "high" | "normal" | "low";

const PRIORITIES: {
  value: Priority;
  label: string;
  color: string;
  bg: string;
}[] = [
  { value: "urgent", label: "긴급", color: "text-red-500", bg: "bg-red-500" },
  { value: "high", label: "높음", color: "text-amber-500", bg: "bg-amber-500" },
  { value: "normal", label: "보통", color: "text-blue-500", bg: "bg-blue-500" },
  { value: "low", label: "낮음", color: "text-slate-400", bg: "bg-slate-400" },
];

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function getPriorityConfig(p: string) {
  return PRIORITIES.find((pr) => pr.value === p) || PRIORITIES[2];
}

function getPriorityBadgeStyle(p: string) {
  switch (p) {
    case "urgent":
      return "text-red-500 border-red-200/60 bg-red-50 dark:bg-red-950/30 dark:border-red-800/40";
    case "high":
      return "text-amber-500 border-amber-200/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/40";
    case "normal":
      return "text-blue-500 border-blue-200/60 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800/40";
    case "low":
      return "text-slate-400 border-slate-200/60 bg-slate-50 dark:bg-slate-800/30 dark:border-slate-700/40";
    default:
      return "text-blue-500 border-blue-200/60 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800/40";
  }
}

// ─── 할일 폼 다이얼로그 ─────────────────────────────
type DialogMode = "create" | "edit";

interface TodoFormData {
  text: string;
  priority: Priority;
}

function TodoFormDialog({
  open,
  onOpenChange,
  onSave,
  initial,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TodoFormData) => void;
  initial?: TodoFormData;
  mode: DialogMode;
}) {
  const [form, setForm] = useState<TodoFormData>(
    initial || { text: "", priority: "normal" },
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(initial || { text: "", priority: "normal" });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, initial]);

  const handleSave = () => {
    if (!form.text.trim()) return;
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-h-[80vh] rounded-2xl p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle className="text-[15px]">
            {mode === "edit" ? "할 일 수정" : "새 할 일 추가"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground">
            {mode === "edit"
              ? "할 일 내용을 수정하세요."
              : "새로운 할 일을 입력하세요."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto min-h-0 scrollbar-thin">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">
              내용 *
            </label>
            <Input
              ref={inputRef}
              value={form.text}
              onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="할 일을 입력하세요"
              className="h-10 text-[13px] border-border/50 bg-muted/20 rounded-xl px-3.5"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">
              우선순위
            </label>
            <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setForm((prev) => ({ ...prev, priority: p.value }))}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors",
                    form.priority === p.value
                      ? "bg-background shadow-sm " + p.color
                      : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      form.priority === p.value
                        ? p.bg
                        : "bg-muted-foreground/25",
                    )}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-5 pt-3 shrink-0 border-t border-border/30">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-[12px] h-9"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.text.trim()}
            className="rounded-xl text-[12px] h-9 bg-primary hover:bg-primary/90"
          >
            {mode === "edit" ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────
export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchTodos = useCallback(async () => {
    try {
      const data = await window.electron.ipcRenderer.invoke("todos:getAll");
      setTodos(data || []);
    } catch (err) {
      console.error("Failed to fetch todos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // ── CRUD ──
  const handleCreate = async (data: TodoFormData) => {
    try {
      const created = await window.electron.ipcRenderer.invoke("todos:create", {
        text: data.text,
        priority: data.priority,
      });
      setTodos((prev) => [created, ...prev]);
    } catch (err) {
      console.error("Failed to create todo:", err);
    }
  };

  const handleUpdate = async (data: TodoFormData) => {
    if (!editingTodo) return;
    try {
      const updated = await window.electron.ipcRenderer.invoke(
        "todos:update",
        editingTodo.id,
        { text: data.text, priority: data.priority },
      );
      setTodos((prev) =>
        prev.map((t) => (t.id === editingTodo.id ? updated : t)),
      );
      setEditingTodo(null);
    } catch (err) {
      console.error("Failed to update todo:", err);
    }
  };

  const toggleTodo = useCallback(
    async (todo: Todo) => {
      try {
        const updated = await window.electron.ipcRenderer.invoke(
          "todos:update",
          todo.id,
          { completed: !todo.completed },
        );
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
      } catch (err) {
        console.error("Failed to toggle todo:", err);
      }
    },
    [],
  );

  const handleDeleteSelected = async () => {
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) => window.electron.ipcRenderer.invoke("todos:delete", id)),
      );
      setTodos((prev) => prev.filter((t) => !selectedIds.has(t.id)));
      setSelectedIds(new Set());
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error("Failed to delete todos:", err);
    }
  };

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleEditSelected = () => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    const todo = todos.find((t) => t.id === id);
    if (todo) setEditingTodo(todo);
  };

  // ── 필터 + 정렬 (memoized) ──
  const filtered = useMemo(() => {
    return todos
      .filter((t) => {
        if (filter === "active") return !t.completed;
        if (filter === "completed") return !!t.completed;
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed - b.completed;
        const pa = PRIORITY_ORDER[a.priority || "normal"] ?? 2;
        const pb = PRIORITY_ORDER[b.priority || "normal"] ?? 2;
        return pa - pb;
      });
  }, [todos, filter]);

  const activeCount = useMemo(
    () => todos.filter((t) => !t.completed).length,
    [todos],
  );

  const editFormData: TodoFormData | undefined = editingTodo
    ? { text: editingTodo.text, priority: (editingTodo.priority || "normal") as Priority }
    : undefined;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* ── 상단 헤더 ── */}
      <div className="flex-shrink-0 space-y-4 px-6 pt-2 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold leading-none">나의 할 일</h2>
              <p className="text-[10px] text-muted-foreground mt-1">
                남은 항목 {activeCount}개
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 필터 */}
            <div className="inline-flex items-center gap-1 bg-muted/60 p-1 rounded-xl mr-2">
              {(["all", "active", "completed"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors",
                    filter === f
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {f === "all" ? "전체" : f === "active" ? "진행중" : "완료"}
                </button>
              ))}
            </div>

            {/* 수정 */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-xl",
                selectedIds.size === 1
                  ? "text-primary"
                  : "text-muted-foreground/30 cursor-not-allowed",
              )}
              disabled={selectedIds.size !== 1}
              onClick={handleEditSelected}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* 삭제 */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-xl",
                selectedIds.size > 0
                  ? "text-destructive"
                  : "text-muted-foreground/30 cursor-not-allowed",
              )}
              disabled={selectedIds.size === 0}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* 추가 */}
            <Button
              size="icon"
              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── 할일 목록 ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 scrollbar-thin scrollbar-stable">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/30" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
              <ListFilter className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="text-[12px] text-muted-foreground/60 font-medium">
              내역이 없습니다
            </p>
          </div>
        ) : (
          filtered.map((todo) => {
            const isSelected = selectedIds.has(todo.id);

            return (
              <div
                key={todo.id}
                className={cn(
                  "rounded-2xl border px-4 py-3 transition-colors duration-150",
                  todo.completed
                    ? "border-border/30 bg-muted/5 opacity-50"
                    : "border-border/50 bg-card",
                )}
              >
                <div className="flex items-center gap-3">
                  {/* 체크박스 (선택) */}
                  <div className="shrink-0">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(todo.id)}
                      className="h-4 w-4 rounded-[4px] border-2 border-muted-foreground/30"
                    />
                  </div>

                  {/* 완료 토글 */}
                  <button
                    onClick={() => toggleTodo(todo)}
                    className="shrink-0 active:scale-90"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="h-[18px] w-[18px] text-primary" />
                    ) : (
                      <span className="h-[18px] w-[18px] rounded-full border-2 border-muted-foreground/30 block" />
                    )}
                  </button>

                  {/* 본문 */}
                  <div className="flex-1 flex items-center gap-2 overflow-hidden min-w-0">
                    {!todo.completed && (
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0",
                          getPriorityBadgeStyle(todo.priority || "normal"),
                        )}
                      >
                        {getPriorityConfig(todo.priority || "normal").label}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-[13px] font-medium truncate",
                        todo.completed && "line-through text-muted-foreground/60",
                      )}
                    >
                      {todo.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 생성 다이얼로그 ── */}
      {createOpen && (
        <TodoFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSave={handleCreate}
          mode="create"
        />
      )}

      {/* ── 수정 다이얼로그 ── */}
      {editingTodo && (
        <TodoFormDialog
          open={!!editingTodo}
          onOpenChange={(open) => {
            if (!open) setEditingTodo(null);
          }}
          onSave={handleUpdate}
          initial={editFormData}
          mode="edit"
        />
      )}

      {/* ── 삭제 확인 ── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">할 일 삭제</DialogTitle>
            <DialogDescription className="text-[12px]">
              선택한 {selectedIds.size}개의 할 일을 삭제하시겠습니까? 이 작업은
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

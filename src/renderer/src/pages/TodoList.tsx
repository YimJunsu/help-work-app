import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  Circle,
  CheckCircle2,
  ListFilter,
  Loader2,
  Pencil,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
  {
    value: "high",
    label: "높음",
    color: "text-amber-500",
    bg: "bg-amber-500",
  },
  {
    value: "normal",
    label: "보통",
    color: "text-blue-500",
    bg: "bg-blue-500",
  },
  {
    value: "low",
    label: "낮음",
    color: "text-slate-400",
    bg: "bg-slate-400",
  },
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

function getPriorityLabel(p: string) {
  return getPriorityConfig(p).label;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [priority, setPriority] = useState<Priority>("normal");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("normal");
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (editingId !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const addTodo = async () => {
    const text = input.trim();
    if (!text) return;
    try {
      const created = await window.electron.ipcRenderer.invoke(
        "todos:create",
        { text, priority },
      );
      setTodos((prev) => [created, ...prev]);
      setInput("");
      setPriority("normal");
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to create todo:", err);
    }
  };

  const toggleTodo = async (todo: Todo) => {
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
  };

  const deleteTodo = (id: number) => setDeletingId(id);

  const handleAnimationEnd = async (id: number) => {
    if (deletingId !== id) return;
    try {
      await window.electron.ipcRenderer.invoke("todos:delete", id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete todo:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (todo: Todo) => {
    if (todo.completed) return;
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditPriority((todo.priority || "normal") as Priority);
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    const trimmed = editText.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    try {
      const updated = await window.electron.ipcRenderer.invoke(
        "todos:update",
        editingId,
        { text: trimmed, priority: editPriority },
      );
      setTodos((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
    } catch (err) {
      console.error("Failed to update todo:", err);
    } finally {
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const filtered = todos
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

  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* ── 상단: 필터 + 입력 ── */}
      <div className="flex-shrink-0 space-y-4 px-6 pt-2 pb-4">
        {/* 타이틀 + 필터 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold leading-none">
                나의 할 일
              </h2>
              <p className="text-[10px] text-muted-foreground mt-1">
                남은 항목 {activeCount}개
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
            {(["all", "active", "completed"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200",
                  filter === f
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "all" ? "전체" : f === "active" ? "진행중" : "완료"}
              </button>
            ))}
          </div>
        </div>

        {/* 입력 영역 */}
        <div className="rounded-2xl border border-border/50 bg-card p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="새로운 할 일을 입력하세요..."
              className="h-10 text-[13px] flex-1 border-0 bg-muted/30 shadow-none rounded-xl px-3.5 focus-visible:ring-1 focus-visible:ring-primary/30 placeholder:text-muted-foreground/40 transition-all"
            />
            <Button
              onClick={addTodo}
              disabled={!input.trim()}
              size="icon"
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shrink-0 transition-all duration-200 disabled:opacity-20"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* 우선순위 세그먼트 */}
          <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200",
                  priority === p.value
                    ? "bg-background shadow-sm " + p.color
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    priority === p.value ? p.bg : "bg-muted-foreground/25",
                  )}
                />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 할일 목록 ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 scrollbar-thin">
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
          filtered.map((todo) =>
            editingId === todo.id ? (
              /* ── 편집 모드 ── */
              <div
                key={todo.id}
                className="flex items-center gap-2.5 rounded-2xl border-2 border-primary/30 bg-primary/[0.03] px-4 py-2.5 transition-all"
              >
                <select
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(e.target.value as Priority)
                  }
                  className="text-[11px] font-semibold rounded-lg border border-border/50 px-2 py-1.5 bg-background shrink-0 outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>

                <Input
                  ref={editInputRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  onBlur={saveEdit}
                  className="h-8 text-[13px] flex-1 border-0 bg-background/80 shadow-sm rounded-lg px-2.5 focus-visible:ring-1 focus-visible:ring-primary/30"
                />

                <button
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50 transition-colors shrink-0"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    cancelEdit();
                  }}
                >
                  취소
                </button>
              </div>
            ) : (
              /* ── 보기 모드 ── */
              <div
                key={todo.id}
                onAnimationEnd={() => handleAnimationEnd(todo.id)}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
                  deletingId === todo.id && "animate-slide-out-right",
                  todo.completed
                    ? "border-border/30 bg-muted/5 opacity-50"
                    : "border-border/50 bg-card hover:shadow-sm hover:border-border",
                )}
              >
                <button
                  onClick={() => toggleTodo(todo)}
                  className="shrink-0 transition-transform active:scale-90"
                >
                  {todo.completed ? (
                    <CheckCircle2 className="h-[18px] w-[18px] text-primary" />
                  ) : (
                    <Circle className="h-[18px] w-[18px] text-muted-foreground/40 hover:text-primary transition-colors" />
                  )}
                </button>

                <div className="flex-1 flex items-center gap-2 overflow-hidden min-w-0">
                  {!todo.completed && (
                    <span
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0",
                        getPriorityBadgeStyle(todo.priority || "normal"),
                      )}
                    >
                      {getPriorityLabel(todo.priority || "normal")}
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

                {/* 액션 버튼 */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {!todo.completed && (
                    <button
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all"
                      onClick={() => startEdit(todo)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}

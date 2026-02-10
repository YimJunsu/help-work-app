import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  CalendarCheck,
  Loader2,
  Clock,
  User,
  Globe,
  CheckCircle2,
  Circle,
  ListFilter,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
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
  ScheduleFormDialog,
  getCategoryLabel,
  getCategoryStyle,
  type ScheduleFormData,
} from "../components/ScheduleFormDialog";

interface Schedule {
  id: number;
  text: string;
  completed: number;
  category?: string;
  dueDate?: string;
  dueTime?: string;
  clientName?: string;
  requestNumber?: string;
  webData?: boolean;
  createdAt: string;
  updatedAt: string;
}

type Filter = "all" | "active" | "completed";

/** D-day 계산 (오늘 기준) */
function getDday(dueDate?: string): number | null {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDdayText(dday: number | null): string {
  if (dday === null) return "";
  if (dday === 0) return "D-Day";
  if (dday < 0) return `D+${Math.abs(dday)}`;
  return `D-${dday}`;
}

/** D-day별 색상/스타일 */
function getDdayColor(dday: number | null): {
  text: string;
  bg: string;
  dot: string;
  animate: boolean;
} {
  if (dday === null)
    return { text: "", bg: "", dot: "", animate: false };
  if (dday <= 0)
    return {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50",
      dot: "bg-red-500",
      animate: true,
    };
  if (dday === 1)
    return {
      text: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800/50",
      dot: "bg-orange-500",
      animate: true,
    };
  return {
    text: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/50",
    dot: "bg-green-500",
    animate: false,
  };
}

function formatDate(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function toInputDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── 메인 컴포넌트 ──────────────────────────────────────
export function DutySchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchSchedules = useCallback(async () => {
    try {
      const data = await window.electron.ipcRenderer.invoke("schedules:getAll");
      setSchedules(data || []);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // ── CRUD ──
  const handleCreate = async (data: ScheduleFormData) => {
    try {
      const created = await window.electron.ipcRenderer.invoke(
        "schedules:create",
        {
          text: data.text,
          completed: false,
          category: data.category,
          dueDate: data.dueDate || null,
          dueTime: data.dueTime || null,
          clientName: data.clientName || null,
          requestNumber: data.requestNumber || null,
          webData: data.webData,
        },
      );
      setSchedules((prev) => [created, ...prev]);
    } catch (err) {
      console.error("Failed to create schedule:", err);
    }
  };

  const handleUpdate = async (data: ScheduleFormData) => {
    if (!editingSchedule) return;
    try {
      const updated = await window.electron.ipcRenderer.invoke(
        "schedules:update",
        editingSchedule.id,
        {
          text: data.text,
          category: data.category,
          dueDate: data.dueDate || null,
          dueTime: data.dueTime || null,
          clientName: data.clientName || null,
          requestNumber: data.requestNumber || null,
          webData: data.webData,
        },
      );
      setSchedules((prev) =>
        prev.map((s) => (s.id === editingSchedule.id ? updated : s)),
      );
      setEditingSchedule(null);
    } catch (err) {
      console.error("Failed to update schedule:", err);
    }
  };

  const toggleComplete = async (schedule: Schedule) => {
    try {
      const updated = await window.electron.ipcRenderer.invoke(
        "schedules:update",
        schedule.id,
        { completed: !schedule.completed },
      );
      setSchedules((prev) =>
        prev.map((s) => (s.id === schedule.id ? updated : s)),
      );
    } catch (err) {
      console.error("Failed to toggle schedule:", err);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) =>
          window.electron.ipcRenderer.invoke("schedules:delete", id),
        ),
      );
      setSchedules((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error("Failed to delete schedules:", err);
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

  const handleEditSelected = () => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    const s = schedules.find((sc) => sc.id === id);
    if (s) setEditingSchedule(s);
  };

  // ── 필터 + 정렬 ──
  const filtered = useMemo(() => {
    return schedules
      .filter((s) => {
        if (filter === "active") return !s.completed;
        if (filter === "completed") return !!s.completed;
        return true;
      })
      .sort((a, b) => {
        // 미완료 우선
        if (a.completed !== b.completed) return a.completed - b.completed;
        // 마감일 가까운 순
        if (a.dueDate && b.dueDate)
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
  }, [schedules, filter]);

  const activeCount = schedules.filter((s) => !s.completed).length;

  const editFormData: ScheduleFormData | undefined = editingSchedule
    ? {
        text: editingSchedule.text,
        category: editingSchedule.category || "development",
        dueDate: toInputDate(editingSchedule.dueDate),
        dueTime: editingSchedule.dueTime || "",
        clientName: editingSchedule.clientName || "",
        requestNumber: editingSchedule.requestNumber || "",
        webData: !!editingSchedule.webData,
      }
    : undefined;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* ── 상단 헤더 ── */}
      <div className="flex-shrink-0 space-y-4 px-6 pt-2 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold leading-none">
                나의 스케줄
              </h2>
              <p className="text-[10px] text-muted-foreground mt-1">
                진행중 {activeCount}건
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
                    "px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors duration-200",
                    filter === f
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
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
                "h-8 w-8 rounded-xl transition-colors",
                selectedIds.size === 1
                  ? "text-primary hover:bg-primary/10"
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
                "h-8 w-8 rounded-xl transition-colors",
                selectedIds.size > 0
                  ? "text-destructive hover:bg-destructive/10"
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
              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── 리스트 ── */}
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
              스케줄이 없습니다
            </p>
          </div>
        ) : (
          filtered.map((schedule) => {
            const dday = schedule.completed ? null : getDday(schedule.dueDate);
            const ddayStyle = getDdayColor(dday);
            const isSelected = selectedIds.has(schedule.id);

            return (
              <div
                key={schedule.id}
                className={cn(
                  "rounded-2xl border px-4 py-3.5 transition-colors duration-150",
                  schedule.completed
                    ? "border-border/30 bg-muted/5 opacity-50"
                    : "border-border/50 bg-card",
                )}
              >
                <div className="flex items-start gap-3">
                  {/* 체크박스 (선택) */}
                  <div
                    className="pt-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(schedule.id)}
                      className="h-4 w-4 rounded-[4px] border-2 border-muted-foreground/30"
                    />
                  </div>

                  {/* 완료 토글 */}
                  <button
                    onClick={() => toggleComplete(schedule)}
                    className="pt-0.5 shrink-0 transition-transform active:scale-90"
                  >
                    {schedule.completed ? (
                      <CheckCircle2 className="h-[18px] w-[18px] text-primary" />
                    ) : (
                      <Circle className="h-[18px] w-[18px] text-muted-foreground/40" />
                    )}
                  </button>

                  {/* 본문 */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* 1행: 카테고리 + 내용 */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] px-1.5 py-0 h-[18px] shrink-0 font-bold border",
                          getCategoryStyle(schedule.category),
                        )}
                      >
                        {getCategoryLabel(schedule.category)}
                      </Badge>
                      <span
                        className={cn(
                          "text-[13px] font-medium truncate",
                          schedule.completed &&
                            "line-through text-muted-foreground/60",
                        )}
                      >
                        {schedule.text}
                      </span>
                    </div>

                    {/* 2행: 메타 정보 (· 구분) */}
                    {(schedule.requestNumber || schedule.clientName || schedule.dueDate || schedule.webData) && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 flex-wrap">
                        {schedule.requestNumber && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `https://114.unipost.co.kr/home.uni?access=list&srIdx=${schedule.requestNumber}`;
                              window.electron?.ipcRenderer.send("open-external", url);
                            }}
                            className="font-mono font-bold text-primary hover:underline"
                          >
                            #{schedule.requestNumber}
                          </button>
                        )}
                        {schedule.clientName && (
                          <>
                            {schedule.requestNumber && <span className="text-muted-foreground/30">·</span>}
                            <span className="flex items-center gap-0.5">
                              <User className="h-3 w-3" />
                              {schedule.clientName}
                            </span>
                          </>
                        )}
                        {schedule.dueDate && (
                          <>
                            {(schedule.requestNumber || schedule.clientName) && <span className="text-muted-foreground/30">·</span>}
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDate(schedule.dueDate)}
                              {schedule.dueTime && ` ${schedule.dueTime}`}
                            </span>
                          </>
                        )}
                        {schedule.webData && (
                          <>
                            {(schedule.requestNumber || schedule.clientName || schedule.dueDate) && <span className="text-muted-foreground/30">·</span>}
                            <span className="flex items-center gap-0.5">
                              <Globe className="h-3 w-3" />웹
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* D-day 뱃지 */}
                  {dday !== null && (
                    <div
                      className={cn(
                        "shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold",
                        ddayStyle.bg,
                        ddayStyle.text,
                      )}
                    >
                      <span className="relative flex h-2 w-2">
                        {ddayStyle.animate && (
                          <span
                            className={cn(
                              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                              ddayStyle.dot,
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "relative inline-flex rounded-full h-2 w-2",
                            ddayStyle.dot,
                          )}
                        />
                      </span>
                      {getDdayText(dday)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 생성 다이얼로그 ── */}
      {createOpen && (
        <ScheduleFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSave={handleCreate}
          mode="create"
        />
      )}

      {/* ── 수정 다이얼로그 ── */}
      {editingSchedule && (
        <ScheduleFormDialog
          open={!!editingSchedule}
          onOpenChange={(open) => {
            if (!open) setEditingSchedule(null);
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
            <DialogTitle className="text-[15px]">스케줄 삭제</DialogTitle>
            <DialogDescription className="text-[12px]">
              선택한 {selectedIds.size}개의 스케줄을 삭제하시겠습니까? 이 작업은
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

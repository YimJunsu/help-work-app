import { useState, useEffect } from "react";
import {
  CalendarCheck,
  Headset,
  ChevronRight,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import {
  getCategoryLabel,
  getCategoryStyle,
} from "../components/ScheduleFormDialog";
import { getCachedUniSupportData } from "./UniSupport";

type Page = "dashboard" | "todolist" | "schedule" | "unisupport" | "memo" | "setting";

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
}

interface UniPostRequest {
  id: string;
  title: string;
  status: string;
  submissionDate: string;
  requestType?: string;
  handler?: string;
}

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [uniRequests, setUniRequests] = useState<UniPostRequest[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [uniLoading, setUniLoading] = useState(true);

  // 오늘 마감 스케줄 조회
  useEffect(() => {
    (async () => {
      try {
        const data: Schedule[] = await window.electron.ipcRenderer.invoke("schedules:getAll");
        const today = getTodayString();
        const todayItems = (data || [])
          .filter((s) => !s.completed && s.dueDate)
          .filter((s) => {
            const due = new Date(s.dueDate!);
            const dueStr = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
            return dueStr === today;
          })
          .slice(0, 3);
        setTodaySchedules(todayItems);
      } catch (err) {
        console.error("Failed to fetch schedules:", err);
      } finally {
        setScheduleLoading(false);
      }
    })();
  }, []);

  // UniSupport 캐시 데이터 폴링 (프리패치 완료 대기)
  useEffect(() => {
    const check = () => {
      const { requests, isInitialized } = getCachedUniSupportData();
      if (isInitialized) {
        setUniRequests(requests.slice(0, 3));
        setUniLoading(false);
        return true;
      }
      return false;
    };

    if (check()) return;

    // 프리패치가 아직 진행 중이면 짧은 간격으로 폴링
    const timer = setInterval(() => {
      if (check()) clearInterval(timer);
    }, 500);

    // 최대 15초 대기 후 포기
    const timeout = setTimeout(() => {
      clearInterval(timer);
      setUniLoading(false);
    }, 15000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto scrollbar-thin scrollbar-stable space-y-5 px-2">
      {/* ── 오늘 마감 스케줄 ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <CalendarCheck className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <h2 className="text-[13px] font-bold">오늘 마감 스케줄</h2>
            {todaySchedules.length > 0 && (
              <Badge variant="outline" className="text-[10px] py-0 h-5 border-orange-200 text-orange-600 dark:border-orange-800 dark:text-orange-400">
                {todaySchedules.length}건
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1 pr-1"
            onClick={() => onNavigate("schedule")}
          >
            더보기
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {scheduleLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/40" />
          </div>
        ) : todaySchedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-muted/20 px-4 py-6 text-center">
            <p className="text-[12px] text-muted-foreground/60">오늘 마감인 스케줄이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaySchedules.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/50 dark:bg-orange-950/20 px-4 py-3 flex items-center gap-3"
              >
                <div className="shrink-0">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold truncate">{s.text}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] px-1.5 py-0 h-[18px] shrink-0 font-bold border",
                        getCategoryStyle(s.category),
                      )}
                    >
                      {getCategoryLabel(s.category)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                    {s.dueTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.dueTime}
                      </span>
                    )}
                    {s.clientName && <span>{s.clientName}</span>}
                  </div>
                </div>
                <Badge
                  className="shrink-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 hover:bg-red-500"
                >
                  D-Day
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── UniSupport 최근 요청 ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Headset className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="text-[13px] font-bold">UniSupport 요청 현황</h2>
            {uniRequests.length > 0 && (
              <Badge variant="outline" className="text-[10px] py-0 h-5">
                {uniRequests.length}건
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1 pr-1"
            onClick={() => onNavigate("unisupport")}
          >
            더보기
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {uniLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/40" />
          </div>
        ) : uniRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-muted/20 px-4 py-6 text-center">
            <p className="text-[12px] text-muted-foreground/60">UniSupport 요청 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {uniRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-border/50 bg-card px-4 py-3 flex items-center gap-3 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => {
                  const url = `https://114.unipost.co.kr/home.uni?access=list&srIdx=${req.id}`;
                  window.electron?.ipcRenderer.send("open-external", url);
                }}
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-primary font-bold shrink-0">
                      #{req.id}
                    </span>
                    <span className="text-[12px] font-medium truncate">{req.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                    <span>{formatDate(req.submissionDate)}</span>
                    {req.handler && <span>처리자: {req.handler}</span>}
                    {req.requestType && <span>{req.requestType}</span>}
                  </div>
                </div>
                <Badge variant="default" className="text-[10px] shrink-0">
                  {req.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Home, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

type WorkStatus = "off-duty" | "preparing" | "working";

function getWorkStatus(hour: number): WorkStatus {
  if (hour >= 9 && hour < 18) return "working";
  if (hour === 8) return "preparing";
  return "off-duty";
}

function getBatteryPercent(now: Date): number {
  const start = new Date(now);
  start.setHours(9, 0, 0, 0);
  const end = new Date(now);
  end.setHours(18, 0, 0, 0);
  const percent =
    ((end.getTime() - now.getTime()) / (end.getTime() - start.getTime())) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function WorkBatteryIndicator() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const hour = now.getHours();
  const status = getWorkStatus(hour);
  const percent = getBatteryPercent(now);

  // 더 진하고 선명한 컬러 팔레트 적용
  const getTheme = () => {
    if (status === "preparing") return { color: "#2563eb", label: "준비중" }; // 더 진한 Blue
    if (percent > 50) return { color: "#16a34a", label: `${percent}%` }; // 더 진한 Green
    if (percent > 20) return { color: "#d97706", label: `${percent}%` }; // 더 진한 Amber
    return { color: "#dc2626", label: `${percent}%` }; // 더 진한 Red
  };

  const theme = getTheme();

  const BatteryIcon = ({ animate = false }: { animate?: boolean }) => (
    <div
      className={`relative flex items-center ${animate ? "animate-pulse" : ""}`}
    >
      <svg
        width="30"
        height="16"
        viewBox="0 0 30 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 배터리 몸체: stroke 두께를 1.5로 늘려 더 진하게 표현 */}
        <rect
          x="1"
          y="1"
          width="25"
          height="14"
          rx="3"
          stroke={theme.color}
          strokeWidth="1.5"
          className="transition-colors duration-500"
        />
        {/* 배터리 캡: 크기를 키워 실루엣 강화 */}
        <path
          d="M27 5.5C27.5523 5.5 28.5 6 28.5 7V9C28.5 10 27.5523 10.5 27 10.5V5.5Z"
          fill={theme.color}
          className="transition-colors duration-500"
        />
        {/* 내부 게이지: 색상을 꽉 채워 선명하게 표현 */}
        <rect
          x="3.5"
          y="3.5"
          width={(20 * percent) / 100}
          height="9"
          rx="1"
          fill={theme.color}
          className="transition-all duration-700"
        />
      </svg>
    </div>
  );

  if (status === "off-duty") {
    return (
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
        <Home className="h-3.5 w-3.5 text-slate-500" />
        <Zap className="h-3 w-3 animate-pulse text-yellow-600 fill-yellow-600" />
        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">
          쉬는 시간
        </span>
      </div>
    );
  }

  const batteryBody = (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
      <BatteryIcon animate={status === "preparing"} />
      <span
        className="text-[12px] font-black tabular-nums tracking-tight"
        style={{ color: theme.color }}
      >
        {theme.label}
      </span>
    </div>
  );

  if (status === "working" && hour >= 17) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-pointer">{batteryBody}</div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="bg-slate-950 text-white font-bold border-none"
          >
            <p>퇴근까지 얼마 안 남았어요! 🏃</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return batteryBody;
}

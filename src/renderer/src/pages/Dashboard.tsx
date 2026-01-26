/**
 * Dashboard Component - Apple iOS Premium Edition (Refined UI)
 *
 * 개선된 UI 특징:
 * - 생동감 넘치는 오로라 배경 그라디언트
 * - 명확하고 깊이감 있는 Glassmorphism 카드 스타일
 * - 부드러운 진입 애니메이션 (Slide Up) 및 호버 효과 (Levitation)
 * - 더 둥글고 현대적인 모서리 처리
 */

import { useDateChangeDetection } from "../hooks/useDateChangeDetection";
import { useSchedules } from "../hooks/useSchedules";
import { UpcomingSchedules } from "../components/dashboard";
import { WeatherWidget } from "../components/dashboard/WeatherWidget";

interface DashboardProps {
  onNavigate?: (
    page:
      | "dashboard"
      | "todo"
      | "ScheduleCheck"
      | "unisupport"
      | "memo"
      | "fetch"
      | "userinfo"
      | "minigame",
  ) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  /* ============================================
     Data & Effects
     ============================================ */
  const { schedules, loadSchedules } = useSchedules();

  useDateChangeDetection(() => {
    loadSchedules();
  });

  /* ============================================
     UI Styles & Animations
     ============================================ */

  // 공통 Glass Card 스타일 정의
  // 각 컴포넌트가 이 스타일을 가진 컨테이너 안에 담기게 됩니다.
  const glassCardStyle = `
    relative overflow-hidden
    bg-white/40 dark:bg-black/40            /* 더 투명하고 밝은 배경 */
    backdrop-blur-xl                        /* 강력한 블러 효과 */
    border border-white/30 dark:border-white/10 /* 얇고 밝은 테두리로 유리 질감 강조 */
    shadow-lg shadow-black/5 dark:shadow-black/20 /* 부드러운 그림자 */
    rounded-[2rem]                          /* iOS 스타일의 매우 둥근 모서리 */
    p-6                                     /* 넉넉한 내부 여백 */
    transition-all duration-300 ease-out    /* 부드러운 전환 효과 */
    hover:-translate-y-1 hover:shadow-xl    /* 호버 시 살짝 떠오르는 효과 */
  `;

  // 진입 애니메이션 (기존 fade-in보다 동적인 느낌)
  const animationStyle = (delay: number) => ({
    animation: `slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards`,
    animationDelay: `${delay}ms`,
  });

  /* ============================================
     Render - Refined Bento Grid
     ============================================ */

  return (
    // 전체 컨테이너에 약간의 패딩을 주어 배경이 더 잘 보이게 함
    <div className="w-full h-full relative p-4 md:p-6">
      {/* --- 개선된 배경 그라디언트 (Aurora Background) --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* 다크/라이트 모드에 따라 다른 분위기의 오로라 효과 */}
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 dark:from-blue-600/20 dark:to-purple-600/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-r from-rose-400/30 to-orange-300/30 dark:from-rose-600/20 dark:to-orange-500/20 blur-[120px] animate-pulse-slow [animation-delay:4s]" />
      </div>

      {/* --- Bento Grid 레이아웃 --- */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Row 1: 날씨 위젯 */}
        <div className={glassCardStyle} style={animationStyle(0)}>
          <WeatherWidget />
        </div>

        {/* Row 2: 다가오는 일정 */}
        <div className={glassCardStyle} style={animationStyle(100)}>
          <UpcomingSchedules schedules={schedules} onNavigate={onNavigate} />
        </div>

        {/* 하단 여백 */}
        <div className="h-8" />
      </div>
    </div>
  );
}

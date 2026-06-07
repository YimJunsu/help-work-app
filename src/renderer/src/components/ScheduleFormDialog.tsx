import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export type DialogMode = "create" | "edit";

export interface ScheduleFormData {
  text: string;
  category: string;
  dueDate: string;
  dueTime: string;
  clientName: string;
  requestNumber: string;
  webData: boolean;
  repeatType: string;
  repeatValue: string;
}

export const EMPTY_FORM: ScheduleFormData = {
  text: "",
  category: "development",
  dueDate: "",
  dueTime: "",
  clientName: "",
  requestNumber: "",
  webData: false,
  repeatType: "none",
  repeatValue: "",
};

export const REPEAT_OPTIONS = [
  { value: "none", label: "안함" },
  { value: "weekly", label: "매주" },
  { value: "monthly", label: "매월" },
];

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** 반복 요일 선택 옵션 (일~토) */
export const WEEKDAY_OPTIONS = WEEKDAY_LABELS.map((label, idx) => ({
  value: String(idx),
  label: `${label}요일`,
}));

/** 반복일(매월 며칠) 선택 옵션 (1~31일) */
export const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}일`,
}));

/** 자주 쓰는 마감 시간 빠른 선택(24시간 기준) */
const TIME_PRESETS = [
  { label: "오전 9시", value: "09:00" },
  { label: "정오", value: "12:00" },
  { label: "오후 6시", value: "18:00" },
  { label: "자정 전", value: "23:59" },
];

/** 반복 일정 표시용 라벨 (ex. "매주 금요일 반복", "매월 1일 반복") */
export function getRepeatLabel(repeatType?: string, repeatValue?: string | number | null): string {
  const value =
    repeatValue === null || repeatValue === undefined || repeatValue === ""
      ? null
      : Number(repeatValue);

  if (repeatType === "weekly") {
    const weekday = value !== null ? WEEKDAY_LABELS[value] : undefined;
    return weekday ? `매주 ${weekday}요일 반복` : "매주 반복";
  }
  if (repeatType === "monthly") {
    return value !== null ? `매월 ${value}일 반복` : "매월 반복";
  }
  return "";
}

export const CATEGORIES = [
  { value: "development", label: "개발/수정" },
  { value: "deployment", label: "운영 반영" },
  { value: "inspection", label: "서비스 점검" },
  { value: "other", label: "기타" },
];

export function getCategoryLabel(cat?: string): string {
  return CATEGORIES.find((c) => c.value === cat)?.label || cat || "기타";
}

export function getCategoryStyle(cat?: string): string {
  switch (cat) {
    case "development":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50";
    case "deployment":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50";
    case "inspection":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50";
    case "other":
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50";
  }
}

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ScheduleFormData) => void;
  initial?: ScheduleFormData;
  mode: DialogMode;
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  onSave,
  initial,
  mode,
}: ScheduleFormDialogProps) {
  const [form, setForm] = useState<ScheduleFormData>(initial || EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(initial || EMPTY_FORM);
    }
  }, [open, initial]);

  const update = (key: keyof ScheduleFormData, value: string | boolean) =>
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // 카테고리가 "운영 반영"이 아닌 경우 webData 초기화
      if (key === "category" && value !== "deployment") {
        next.webData = false;
      }
      // 반복 설정이 바뀌면 반복 값(요일/일자) 초기화
      if (key === "repeatType") {
        next.repeatValue = "";
        // 반복 일정은 접수번호를 사용하지 않으므로 초기화
        if (value !== "none") {
          next.requestNumber = "";
        }
      }
      return next;
    });

  const setToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    setForm((prev) => ({ ...prev, dueDate: `${y}-${m}-${d}` }));
  };

  const setCurrentTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setForm((prev) => ({ ...prev, dueTime: `${hh}:${mm}` }));
  };

  const handleSave = () => {
    if (!form.text.trim()) return;
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] rounded-2xl p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle className="text-[15px]">
            {mode === "edit" ? "스케줄 수정" : "새 스케줄 추가"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground">
            {mode === "edit"
              ? "스케줄 정보를 수정하세요."
              : "새로운 스케줄 정보를 입력하세요."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto min-h-0 scrollbar-thin">
          {/* 1행: 반복 설정 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground mr-2.5">
              반복
            </label>
            <div className="inline-flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl">
              {REPEAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("repeatType", opt.value)}
                  className={cn(
                    "px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-colors duration-200",
                    form.repeatType === opt.value
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2행: 고객사명 (+ 접수번호: 반복 미설정 시에만 표시) */}
          <div
            className={cn(
              form.repeatType === "none" && "grid grid-cols-2 gap-3",
            )}
          >
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">
                고객사명
              </label>
              <Input
                value={form.clientName}
                onChange={(e) => update("clientName", e.target.value)}
                placeholder="고객사명을 입력하세요"
                className="h-10 text-[13px] border-border/50 bg-muted/20 rounded-xl px-3.5"
              />
            </div>
            {form.repeatType === "none" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  접수번호
                </label>
                <Input
                  value={form.requestNumber}
                  onChange={(e) => update("requestNumber", e.target.value)}
                  placeholder="접수번호를 입력하세요"
                  className="h-10 text-[13px] border-border/50 bg-muted/20 rounded-xl px-3.5"
                />
              </div>
            )}
          </div>

          {/* 3행: 내용 (Textarea) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">
              내용 *
            </label>
            <Textarea
              value={form.text}
              onChange={(e) => update("text", e.target.value)}
              placeholder="업무 내용을 입력하세요"
              className="min-h-[80px] text-[13px] border-border/50 bg-muted/20 rounded-xl px-3.5 py-2.5 resize-none"
              rows={3}
            />
          </div>

          {/* 4행: 카테고리 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">
              카테고리
            </label>
            <Select
              value={form.category}
              onValueChange={(v) => update("category", v)}
            >
              <SelectTrigger className="h-10 text-[13px] rounded-xl border-border/50 bg-muted/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 5행: 웹데이터 유무 (운영 반영 선택 시에만 표시) */}
          {form.category === "deployment" && (
            <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-3.5">
              <label className="text-[11px] font-semibold text-muted-foreground">
                웹데이터 유무
              </label>
              <RadioGroup
                value={form.webData ? "yes" : "no"}
                onValueChange={(v) => update("webData", v === "yes")}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="yes" id="webdata-yes" />
                  <Label
                    htmlFor="webdata-yes"
                    className="text-[12px] font-medium cursor-pointer"
                  >
                    있음
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="no" id="webdata-no" />
                  <Label
                    htmlFor="webdata-no"
                    className="text-[12px] font-medium cursor-pointer"
                  >
                    없음
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* 6행: 마감일 또는 반복 설정(요일/일자) + 시간 */}
          <div className="grid grid-cols-2 gap-3">
            {form.repeatType === "none" ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between h-[18px]">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    마감일
                  </label>
                  <button
                    type="button"
                    onClick={setToday}
                    className="text-[10px] font-semibold text-primary hover:text-primary/70 transition-colors"
                  >
                    [오늘]
                  </button>
                </div>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => update("dueDate", e.target.value)}
                  className="h-10 text-[13px] border-border/50 bg-muted/20 rounded-xl px-3.5"
                />
              </div>
            ) : form.repeatType === "weekly" ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between h-[18px]">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    반복 요일
                  </label>
                </div>
                <Select
                  value={form.repeatValue}
                  onValueChange={(v) => update("repeatValue", v)}
                >
                  <SelectTrigger className="h-10 text-[13px] rounded-xl border-border/50 bg-muted/20">
                    <SelectValue placeholder="요일 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between h-[18px]">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    반복일
                  </label>
                </div>
                <Select
                  value={form.repeatValue}
                  onValueChange={(v) => update("repeatValue", v)}
                >
                  <SelectTrigger className="h-10 text-[13px] rounded-xl border-border/50 bg-muted/20">
                    <SelectValue placeholder="날짜 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_DAY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between h-[18px]">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  시간 (24시간)
                </label>
                <button
                  type="button"
                  onClick={setCurrentTime}
                  className="text-[10px] font-semibold text-primary hover:text-primary/70 transition-colors"
                >
                  [현재]
                </button>
              </div>
              <Input
                type="time"
                lang="en-GB"
                value={form.dueTime}
                onChange={(e) => update("dueTime", e.target.value)}
                className="h-10 text-[13px] border-border/50 bg-muted/20 rounded-xl px-3.5"
              />
              <div className="flex items-center gap-1 pt-0.5">
                {TIME_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => update("dueTime", preset.value)}
                    className={cn(
                      "px-2 py-1 text-[10px] font-semibold rounded-lg border transition-colors",
                      form.dueTime === preset.value
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "border-border/50 text-muted-foreground/70 hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
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

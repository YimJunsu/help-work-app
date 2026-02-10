import { useState, useEffect } from "react";
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
}

export const EMPTY_FORM: ScheduleFormData = {
  text: "",
  category: "development",
  dueDate: "",
  dueTime: "",
  clientName: "",
  requestNumber: "",
  webData: false,
};

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
      return next;
    });

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
          {/* 1행: 고객사명 + 접수번호 */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* 2행: 내용 (Textarea) */}
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

          {/* 3행: 카테고리 */}
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

          {/* 4행: 웹데이터 유무 (운영 반영 선택 시에만 표시) */}
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

          {/* 5행: 마감일 + 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">
                마감일
              </label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => update("dueDate", e.target.value)}
                className="h-10 text-[13px] border-border/50 bg-muted/20 rounded-xl px-3.5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">
                시간
              </label>
              <Input
                type="time"
                value={form.dueTime}
                onChange={(e) => update("dueTime", e.target.value)}
                className="h-10 text-[13px] border-border/50 bg-muted/20 rounded-xl px-3.5"
              />
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

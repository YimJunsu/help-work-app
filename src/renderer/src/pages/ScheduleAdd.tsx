import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Calendar } from '../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Checkbox } from '../components/ui/checkbox'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

interface ScheduleAddProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddSchedule: (schedule: { text: string; category?: string; dueDate?: Date; clientName?: string; webData?: boolean }) => void
  editingSchedule?: { id: number; text: string; category?: string; dueDate?: string; clientName?: string; webData?: number | boolean } | null
  initialDate?: Date | null
}

export function ScheduleAdd({ open, onOpenChange, onAddSchedule, editingSchedule, initialDate }: ScheduleAddProps) {
  const now = new Date()
  const currentHour = now.getHours().toString().padStart(2, '0')
  const currentMinute = (Math.round(now.getMinutes() / 5) * 5).toString().padStart(2, '0')

  const [newSchedule, setNewSchedule] = useState('')
  const [clientName, setClientName] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedHour, setSelectedHour] = useState<string>(currentHour)
  const [selectedMinute, setSelectedMinute] = useState<string>(currentMinute)
  const [newScheduleCategory, setNewScheduleCategory] = useState<string | undefined>(undefined)
  const [customCategory, setCustomCategory] = useState('')
  const [webData, setWebData] = useState<boolean>(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  // Load editing schedule data when editingSchedule changes
  useEffect(() => {
    if (editingSchedule) {
      setNewSchedule(editingSchedule.text)
      setClientName(editingSchedule.clientName || '')

      const dateObj = editingSchedule.dueDate ? new Date(editingSchedule.dueDate) : new Date()
      setSelectedDate(dateObj)
      setSelectedHour(dateObj.getHours().toString().padStart(2, '0'))
      // 분을 5분 단위로 반올림
      const minutes = dateObj.getMinutes()
      const roundedMinutes = Math.round(minutes / 5) * 5
      setSelectedMinute(roundedMinutes.toString().padStart(2, '0'))

      // Handle custom category (기타-xxx)
      if (editingSchedule.category?.startsWith('기타-')) {
        setNewScheduleCategory('ex')
        setCustomCategory(editingSchedule.category.substring(3))
      } else {
        setNewScheduleCategory(editingSchedule.category)
        setCustomCategory('')
      }

      setWebData(Boolean(editingSchedule.webData))
    } else {
      // 새 스케줄 추가 시 현재 시간으로 초기화
      const currentTime = new Date()
      const dateToUse = initialDate || new Date()
      setNewSchedule('')
      setClientName('')
      setSelectedDate(dateToUse)
      setSelectedHour(currentTime.getHours().toString().padStart(2, '0'))
      setSelectedMinute((Math.round(currentTime.getMinutes() / 5) * 5).toString().padStart(2, '0'))
      setNewScheduleCategory(undefined)
      setCustomCategory('')
      setWebData(false)
    }
  }, [editingSchedule, initialDate])

  const handleAdd = () => {
    if (!clientName.trim()) {
      setAlertMessage("고객사명을 입력해주세요.")
      return
    }

    if (!newSchedule.trim()) {
      setAlertMessage("일정을 입력해주세요.")
      return
    }

    if (!newScheduleCategory) {
      setAlertMessage("카테고리를 선택해주세요.")
      return
    }

    if (newScheduleCategory === 'ex' && !customCategory.trim()) {
      setAlertMessage("기타 카테고리 내용을 입력해주세요.")
      return
    }

    if (!selectedDate) {
      setAlertMessage("마감일을 선택해주세요.")
      return
    }

    // Build final category string
    const finalCategory = newScheduleCategory === 'ex'
      ? `기타-${customCategory.trim()}`
      : newScheduleCategory

    // Combine date and time
    const finalDate = new Date(selectedDate)
    finalDate.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0)

    onAddSchedule({
      text: newSchedule.trim(),
      category: finalCategory,
      dueDate: finalDate,
      clientName: clientName.trim(),
      webData: newScheduleCategory === 'reflect' ? webData : undefined
    })

    // Reset form with current time
    const resetTime = new Date()
    setNewSchedule('')
    setClientName('')
    setSelectedDate(new Date())
    setSelectedHour(resetTime.getHours().toString().padStart(2, '0'))
    setSelectedMinute((Math.round(resetTime.getMinutes() / 5) * 5).toString().padStart(2, '0'))
    setNewScheduleCategory(undefined)
    setCustomCategory('')
    setWebData(false)
    setAlertMessage(null)
    onOpenChange(false)
  }

  const handleCancel = () => {
    const resetTime = new Date()
    setNewSchedule('')
    setClientName('')
    setSelectedDate(new Date())
    setSelectedHour(resetTime.getHours().toString().padStart(2, '0'))
    setSelectedMinute((Math.round(resetTime.getMinutes() / 5) * 5).toString().padStart(2, '0'))
    setNewScheduleCategory(undefined)
    setCustomCategory('')
    setWebData(false)
    setAlertMessage(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-md border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editingSchedule ? "Edit Schedule" : "Add Schedule"}
          </DialogTitle>
          <DialogDescription>
            {editingSchedule
              ? "일정을 수정하세요."
              : "새로운 일정을 추가하세요."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {alertMessage && (
            <Alert variant="destructive">
              <AlertTitle>경고!</AlertTitle>
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">고객사명</label>
            <Input
              placeholder="고객사명을 입력하세요."
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="border-border focus:border-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">내용</label>
            <Input
              placeholder="내용을 입력하세요."
              value={newSchedule}
              onChange={(e) => {
                setNewSchedule(e.target.value);
                setAlertMessage(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="border-border focus:border-ring"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select
              value={newScheduleCategory}
              onValueChange={setNewScheduleCategory}
            >
              <SelectTrigger className="border-border focus:border-ring">
                <SelectValue placeholder="Choose Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="develop">개발/수정</SelectItem>
                <SelectItem value="reflect">운영 반영</SelectItem>
                <SelectItem value="inspection">서비스 점검</SelectItem>
                <SelectItem value="ex">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newScheduleCategory === "ex" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">기타 카테고리 상세</label>
              <Input
                placeholder="기타 카테고리 내용을 입력하세요"
                value={customCategory}
                onChange={(e) => {
                  setCustomCategory(e.target.value);
                  setAlertMessage(null);
                }}
                className="border-border focus:border-ring"
              />
            </div>
          )}

          {newScheduleCategory === "reflect" && (
            <div className="flex items-center space-x-2">
              <label
                htmlFor="webData"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                웹데이터 유무
              </label>
              <Checkbox
                id="webData"
                checked={webData}
                onCheckedChange={(checked) => setWebData(checked as boolean)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">DeadLine</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal border-border focus:border-ring"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })
                  ) : (
                    <span>Choose DeadLine</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Time</label>
            <div className="flex gap-2">
              <Select value={selectedHour} onValueChange={setSelectedHour}>
                <SelectTrigger className="border-border focus:border-ring">
                  <SelectValue placeholder="시" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}시
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                <SelectTrigger className="border-border focus:border-ring">
                  <SelectValue placeholder="분" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')).map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}분
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              취소
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {editingSchedule ? "수정" : "추가"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

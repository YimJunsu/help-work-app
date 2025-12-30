import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Calendar } from '../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Calendar as CalendarIcon, CalendarPlus } from 'lucide-react'
import { Checkbox } from '../components/ui/checkbox'
import { Label } from '../components/ui/label'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

interface ScheduleAddProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddSchedule: (schedule: { text: string; category?: string; dueDate?: Date; clientName?: string; requestNumber?: string; webData?: boolean }) => void
  editingSchedule?: { id: number; text: string; category?: string; dueDate?: string; clientName?: string; requestNumber?: string; webData?: number | boolean } | null
  initialDate?: Date | null
}

export function ScheduleAdd({ open, onOpenChange, onAddSchedule, editingSchedule, initialDate }: ScheduleAddProps) {
  const now = new Date()
  const currentHour = now.getHours().toString().padStart(2, '0')
  const currentMinute = (Math.round(now.getMinutes() / 5) * 5).toString().padStart(2, '0')

  const [newSchedule, setNewSchedule] = useState('')
  const [clientName, setClientName] = useState('')
  const [requestNumber, setRequestNumber] = useState('')
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
      setRequestNumber(editingSchedule.requestNumber || '')

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
      setRequestNumber('')
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
      requestNumber: requestNumber.trim() || undefined,
      webData: newScheduleCategory === 'reflect' ? webData : undefined
    })

    // Reset form with current time
    const resetTime = new Date()
    setNewSchedule('')
    setClientName('')
    setRequestNumber('')
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
    setRequestNumber('')
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
      <DialogContent className="max-w-lg border shadow-sm">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {editingSchedule ? "일정 수정" : "일정 추가"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {editingSchedule ? "일정 정보를 수정하세요" : "새로운 일정을 추가하세요"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          {alertMessage && (
            <Alert variant="destructive" className="py-2">
              <AlertTitle className="text-sm">경고</AlertTitle>
              <AlertDescription className="text-xs">{alertMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="clientName" className="text-sm font-medium">고객사명 *</Label>
              <Input
                id="clientName"
                placeholder="고객사명 입력"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value)
                  setAlertMessage(null)
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="requestNumber" className="text-sm font-medium">접수번호</Label>
              <Input
                id="requestNumber"
                placeholder="접수번호 (선택)"
                value={requestNumber}
                onChange={(e) => setRequestNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content" className="text-sm font-medium">내용 *</Label>
            <Input
              id="content"
              placeholder="일정 내용 입력"
              value={newSchedule}
              onChange={(e) => {
                setNewSchedule(e.target.value);
                setAlertMessage(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm font-medium">카테고리 *</Label>
            <Select
              value={newScheduleCategory}
              onValueChange={(value) => {
                setNewScheduleCategory(value)
                setAlertMessage(null)
              }}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="카테고리 선택" />
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
            <div className="space-y-1.5">
              <Label htmlFor="customCategory" className="text-sm font-medium">기타 상세 *</Label>
              <Input
                id="customCategory"
                placeholder="상세 내용 입력"
                value={customCategory}
                onChange={(e) => {
                  setCustomCategory(e.target.value);
                  setAlertMessage(null);
                }}
              />
            </div>
          )}

          {newScheduleCategory === "reflect" && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
              <Checkbox
                id="webData"
                checked={webData}
                onCheckedChange={(checked) => setWebData(checked as boolean)}
              />
              <Label
                htmlFor="webData"
                className="text-sm font-medium cursor-pointer"
              >
                웹데이터 유무
              </Label>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">마감일 *</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "yyyy-MM-dd (EEE)", { locale: ko })
                    ) : (
                      <span>날짜 선택</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => {
                          const today = new Date()
                          setSelectedDate(today)
                        }}
                      >
                        오늘
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => {
                          const tomorrow = new Date()
                          tomorrow.setDate(tomorrow.getDate() + 1)
                          setSelectedDate(tomorrow)
                        }}
                      >
                        내일
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => {
                          const dayAfter = new Date()
                          dayAfter.setDate(dayAfter.getDate() + 2)
                          setSelectedDate(dayAfter)
                        }}
                      >
                        모레
                      </Button>
                    </div>
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">시간 *</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => {
                    setSelectedHour('09')
                    setSelectedMinute('00')
                  }}
                >
                  09:00
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => {
                    setSelectedHour('13')
                    setSelectedMinute('00')
                  }}
                >
                  13:00
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => {
                    setSelectedHour('17')
                    setSelectedMinute('00')
                  }}
                >
                  17:00
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => {
                    const now = new Date()
                    setSelectedHour(now.getHours().toString().padStart(2, '0'))
                    setSelectedMinute((Math.round(now.getMinutes() / 5) * 5).toString().padStart(2, '0'))
                  }}
                >
                  지금
                </Button>
              </div>
              <div className="flex gap-2">
                <Select value={selectedHour} onValueChange={setSelectedHour}>
                  <SelectTrigger className="flex-1">
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
                  <SelectTrigger className="flex-1">
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
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleCancel} className="px-6">
              취소
            </Button>
            <Button
              onClick={handleAdd}
              className="px-6"
            >
              {editingSchedule ? "수정" : "추가"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

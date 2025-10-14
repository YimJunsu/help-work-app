import { useState } from 'react'
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
}

export function ScheduleAdd({ open, onOpenChange, onAddSchedule }: ScheduleAddProps) {
  const [newSchedule, setNewSchedule] = useState('')
  const [clientName, setClientName] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [newScheduleCategory, setNewScheduleCategory] = useState<string | undefined>(undefined)
  const [webData, setWebData] = useState<boolean>(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

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

    if (!selectedDate) {
      setAlertMessage("마감일을 선택해주세요.")
      return
    }

    onAddSchedule({
      text: newSchedule.trim(),
      category: newScheduleCategory,
      dueDate: selectedDate,
      clientName: clientName.trim(),
      webData: newScheduleCategory === 'reflect' ? webData : undefined
    })

    // Reset form
    setNewSchedule('')
    setClientName('')
    setSelectedDate(undefined)
    setNewScheduleCategory(undefined)
    setWebData(false)
    setAlertMessage(null)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setNewSchedule('')
    setClientName('')
    setSelectedDate(undefined)
    setNewScheduleCategory(undefined)
    setWebData(false)
    setAlertMessage(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-md border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add Schedule</DialogTitle>
          <DialogDescription>새로운 일정을 추가하세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {alertMessage && (
            <Alert variant="destructive">
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">고객사명</label>
            <Input
              placeholder="고객사명을 입력하세요"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="border-border focus:border-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">내용</label>
            <Input
              placeholder="일정 내용을 입력하세요"
              value={newSchedule}
              onChange={(e) => {
                setNewSchedule(e.target.value)
                setAlertMessage(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="border-border focus:border-ring"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={newScheduleCategory} onValueChange={setNewScheduleCategory}>
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

          {newScheduleCategory === 'reflect' && (
            <div className="flex items-center space-x-2">
              <label
                htmlFor="webData"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                웹데이터 유무
              </label>
              <
                Checkbox
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
                <Button variant="outline" className="w-full justify-start text-left font-normal border-border focus:border-ring">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "yyyy년 MM월 dd일", { locale: ko }) : <span>Choose DeadLine</span>}
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

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              취소
            </Button>
            <Button onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

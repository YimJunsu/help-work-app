import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Calendar } from '../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Plus, Trash2, Calendar as CalendarIcon, List, Aperture, Heart, GraduationCap, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

interface Schedule {
  id: string
  text: string
  completed: boolean
  category?: string
  dueDate?: Date
}

interface ScheduleProps {
  onDialogChange?: (isOpen: boolean) => void
}

export function ScheduleCheck({ onDialogChange }: ScheduleProps) {
  // Load todos from localStorage on initial mount
  const [todos, setSchedules] = useState<Schedule[]>(() => {
    const savedSchedules = localStorage.getItem('todos')
    if (savedSchedules) {
      const parsedSchedules = JSON.parse(savedSchedules)
      // Convert date strings back to Date objects
      return parsedSchedules.map((todo: any) => ({
        ...todo,
        dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined
      }))
    }
    // Default test data
    return [
      { id: '1', text: '테스트 데이터 1', completed: false, category: 'work' },
      { id: '2', text: '테스트 데이터 2', completed: true, category: 'health' },
      { id: '3', text: '테스트 데이터 3', completed: false, category: 'study' },
      { id: '4', text: '테스트 데이터 4', completed: false, category: 'study' },
      { id: '5', text: '테스트 데이터 5', completed: false, category: 'study' }
    ]
  })
  const [newSchedule, setNewSchedule] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deletingSchedules, setDeletingSchedules] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [newScheduleCategory, setNewScheduleCategory] = useState<string | undefined>(undefined)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    onDialogChange?.(showAddDialog)
  }, [showAddDialog, onDialogChange])

  const addSchedule = () => {
    if (!newSchedule.trim()) {
      setAlertMessage("일정을 입력하세요.")
      return
    }

    setSchedules([
      ...todos,
      {
        id: Date.now().toString(),
        text: newSchedule.trim(),
        completed: false,
        category: newScheduleCategory,
        dueDate: selectedDate
      }
    ])
    setNewSchedule('')
    setSelectedDate(undefined)
    setNewScheduleCategory(undefined)
    setShowAddDialog(false)
    setAlertMessage(null)
  }

  const toggleSchedule = (id: string) => {
    setSchedules(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteSchedule = (id: string) => {
    setDeletingSchedules(prev => new Set([...prev, id]))
    setTimeout(() => {
      setSchedules(todos => todos.filter(todo => todo.id !== id))
      setDeletingSchedules(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }, 300)
  }

  const clearCompletedSchedules = () => {
    const completedIds = todos.filter(todo => todo.completed).map(todo => todo.id)
    setDeletingSchedules(new Set(completedIds))
    setTimeout(() => {
      setSchedules(todos => todos.filter(todo => !todo.completed))
      setDeletingSchedules(new Set())
    }, 300)
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'work': return 'bg-primary/10 text-primary'
      case 'health': return 'bg-accent/10 text-accent-foreground'
      case 'study': return 'bg-secondary text-secondary-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'work': return '업무'
      case 'health': return '건강'
      case 'study': return '학습'
      default: return category
    }
  }

  const categories = [
    { id: null, name: '전체', icon: List, count: todos.length },
    { id: 'work', name: '업무', icon: Aperture, count: todos.filter(t => t.category === 'work').length },
    { id: 'health', name: '건강', icon: Heart, count: todos.filter(t => t.category === 'health').length },
    { id: 'study', name: '학습', icon: GraduationCap, count: todos.filter(t => t.category === 'study').length }
  ]

  const getCategoryBadgeColor = (categoryId: string | null, isSelected: boolean) => {
    if (isSelected) {
      switch (categoryId) {
        case 'work': return 'bg-primary text-primary-foreground hover:bg-primary/90'
        case 'health': return 'bg-accent text-accent-foreground hover:bg-accent/90'
        case 'study': return 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
        default: return 'bg-foreground text-background hover:bg-foreground/90'
      }
    } else {
      switch (categoryId) {
        case 'work': return 'bg-primary/10 text-primary hover:bg-primary/20'
        case 'health': return 'bg-accent/10 text-accent-foreground hover:bg-accent/20'
        case 'study': return 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        default: return 'bg-muted text-muted-foreground hover:bg-muted/80'
      }
    }
  }

  const filteredSchedules = selectedCategory
    ? todos.filter(todo => todo.category === selectedCategory)
    : todos

  const completedCount = filteredSchedules.filter(todo => todo.completed).length
  const totalCount = filteredSchedules.length

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-card-foreground">Work Schedule Check</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm font-medium">
                {completedCount}/{totalCount} 완료
              </Badge>
              {completedCount > 0 && (
                <Button
                  onClick={clearCompletedSchedules}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="완료된 할 일 삭제"
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>
              )}
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-primary border border-border" />
                <div className="w-3 h-3 rounded-full bg-secondary border border-border" />
                <div className="w-3 h-3 rounded-full bg-accent border border-border" />
              </div>
              <Button onClick={() => setShowAddDialog(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md transition-all duration-200">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon
              const isSelected = selectedCategory === category.id
              return (
                <Badge
                  key={category.id}
                  className={`cursor-pointer px-3 py-1.5 text-sm font-medium transition-all duration-200 border-0 ${getCategoryBadgeColor(category.id, isSelected)}`}
                  onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                >
                  <Icon className="w-3 h-3 mr-1.5" />
                  {category.name}
                  <span className="ml-1.5 text-xs opacity-75">{category.count}</span>
                </Badge>
              )
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            {filteredSchedules.map((todo) => (
              <Card
                key={todo.id}
                className={`border border-border bg-card/70 backdrop-blur-sm hover:shadow-md transition-all duration-300 ${
                  deletingSchedules.has(todo.id)
                    ? 'transform -translate-x-full opacity-0'
                    : 'transform translate-x-0 opacity-100'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleSchedule(todo.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium transition-all duration-200 ${todo.completed ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                        {todo.text}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {todo.category && (
                          <Badge variant="secondary" className={`text-xs ${getCategoryColor(todo.category)}`}>
                            {getCategoryLabel(todo.category)}
                          </Badge>
                        )}
                        {todo.dueDate && (
                          <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground border-border">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {format(todo.dueDate, "MM/dd", { locale: ko })}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSchedule(todo.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSchedules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg font-medium">{selectedCategory ? '해당 카테고리에 할 일이 없습니다' : '할 일이 없습니다'}</p>
              <p className="text-sm">새로운 할 일을 추가해보세요</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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

            <Input
              placeholder="Enter a new schedule"
              value={newSchedule}
              onChange={(e) => {
                setNewSchedule(e.target.value)
                setAlertMessage(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && addSchedule()}
              className="border-border focus:border-ring"
              autoFocus
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Category (선택사항)</label>
              <Select value={newScheduleCategory} onValueChange={setNewScheduleCategory}>
                <SelectTrigger className="border-border focus:border-ring">
                  <SelectValue placeholder="Please choose Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">업무</SelectItem>
                  <SelectItem value="health">건강</SelectItem>
                  <SelectItem value="study">학습</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">DeadLine (선택사항)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal border-border focus:border-ring">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "yyyy년 MM월 dd일", { locale: ko }) : <span>날짜를 선택하세요</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setNewSchedule('')
                  setSelectedDate(undefined)
                  setNewScheduleCategory(undefined)
                  setAlertMessage(null)
                }}
              >
                취소
              </Button>
              <Button onClick={addSchedule} className="bg-primary text-primary-foreground hover:bg-primary/90">
                추가
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { Badge } from '../ui/badge'
import { List as ListIcon, CodeXml, Send, BadgeCheck, MoreHorizontal } from 'lucide-react'
import { getCategoryBadgeColor } from '../../utils/scheduleUtils'
import type { Schedule } from '../../hooks/useSchedules'

interface CategoryBadgesProps {
  schedules: Schedule[]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
  viewMode?: 'list' | 'calendar'
}

export function CategoryBadges({ schedules, selectedCategory, onSelectCategory, viewMode = 'list' }: CategoryBadgesProps) {
  const categories = [
    { id: null, name: '전체', icon: ListIcon, count: schedules.length },
    { id: 'develop', name: '개발/수정', icon: CodeXml, count: schedules.filter(s => s.category === 'develop').length },
    { id: 'reflect', name: '운영 반영', icon: Send, count: schedules.filter(s => s.category === 'reflect').length },
    { id: 'inspection', name: '서비스 점검', icon: BadgeCheck, count: schedules.filter(s => s.category === 'inspection').length },
    { id: 'ex', name: '기타', icon: MoreHorizontal, count: schedules.filter(s => s.category?.startsWith('기타-')).length }
  ]

  const isCalendar = viewMode === 'calendar'

  return (
    <div className={`flex flex-wrap ${isCalendar ? 'gap-1' : 'mt-4 gap-2'}`}>
      {categories.map((category) => {
        const Icon = category.icon
        const isSelected = selectedCategory === category.id
        return (
          <Badge
            key={category.id}
            className={`cursor-pointer font-medium transition-all duration-200 border-0 ${isCalendar ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1.5 text-sm'} ${getCategoryBadgeColor(category.id, isSelected)}`}
            onClick={() => onSelectCategory(isSelected ? null : category.id)}
          >
            <Icon className={isCalendar ? 'w-2.5 h-2.5 mr-1' : 'w-3 h-3 mr-1.5'} />
            {category.name}
            <span className={`opacity-75 ${isCalendar ? 'ml-1 text-[9px]' : 'ml-1.5 text-xs'}`}>{category.count}</span>
          </Badge>
        )
      })}
    </div>
  )
}

import { Badge } from '../ui/badge'
import { List as ListIcon, CodeXml, Send, BadgeCheck, MoreHorizontal, Info } from 'lucide-react'
import { getCategoryBadgeColor } from '../../utils/scheduleUtils'
import type { Schedule } from '../../hooks/useSchedules'

interface CategoryBadgesProps {
  schedules: Schedule[]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
}

export function CategoryBadges({ schedules, selectedCategory, onSelectCategory }: CategoryBadgesProps) {
  const categories = [
    { id: null, name: '전체', icon: ListIcon, count: schedules.length },
    { id: 'develop', name: '개발/수정', icon: CodeXml, count: schedules.filter(s => s.category === 'develop').length },
    { id: 'reflect', name: '운영 반영', icon: Send, count: schedules.filter(s => s.category === 'reflect').length },
    { id: 'inspection', name: '서비스 점검', icon: BadgeCheck, count: schedules.filter(s => s.category === 'inspection').length },
    { id: 'guide', name: '사용/원인안내', icon: Info, count: schedules.filter(s => s.category === 'guide').length },
    { id: 'ex', name: '기타', icon: MoreHorizontal, count: schedules.filter(s => s.category?.startsWith('기타-')).length }
  ]

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {categories.map((category) => {
        const Icon = category.icon
        const isSelected = selectedCategory === category.id
        return (
          <Badge
            key={category.id}
            className={`cursor-pointer px-3 py-1.5 text-sm font-medium transition-all duration-200 border-0 ${getCategoryBadgeColor(category.id, isSelected)}`}
            onClick={() => onSelectCategory(isSelected ? null : category.id)}
          >
            <Icon className="w-3 h-3 mr-1.5" />
            {category.name}
            <span className="ml-1.5 text-xs opacity-75">{category.count}</span>
          </Badge>
        )
      })}
    </div>
  )
}
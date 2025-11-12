import { Card, CardContent } from '../ui/card'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { GreetingMessage } from '../../utils/greetingUtils'

interface WelcomeHeaderProps {
  greeting: GreetingMessage
}

export function WelcomeHeader({ greeting }: WelcomeHeaderProps) {
  return (
    <Card className={`border-2 ${greeting.isSpecial ? 'border-primary bg-gradient-to-r from-primary/10 to-primary/5 animate-pulse' : 'border-border/50 bg-gradient-to-r from-card to-card/50'} shadow-sm`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">
              {greeting.message}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
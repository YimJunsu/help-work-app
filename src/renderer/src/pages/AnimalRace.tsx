import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { AlertCircle } from 'lucide-react'

export function AnimalRace() {
  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between min-h-[60px]">
            <div className="flex flex-col justify-center">
              <CardTitle className="text-2xl font-bold text-card-foreground leading-tight">
                동물 달리기 내기
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                준비 중인 게임입니다
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-center h-[500px]">
            <div className="flex flex-col items-center gap-6 text-center max-w-md">
              <AlertCircle className="w-24 h-24 text-muted-foreground/50" />
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-foreground">404</h2>
                <p className="text-xl text-muted-foreground">페이지를 찾을 수 없습니다</p>
                <p className="text-sm text-muted-foreground/70">
                  이 게임은 아직 개발 중입니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
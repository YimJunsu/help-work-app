import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { AlertTriangle, Zap, Slash } from 'lucide-react'

export default function Memo() {
  return (
    <div className="w-full h-full flex flex-col relative">
      {/* 흐릿한 404 백그라운드 */}
      <div className="absolute text-[10rem] text-muted-foreground/10 font-bold top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none">
        404
      </div>

      <Card className="flex-1 border-0 bg-card z-10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-card-foreground">
              Memo
            </CardTitle>
            <Badge variant="destructive" className="text-sm font-medium">
              준비 중
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center border-2 border-dashed border-border animate-pulse">
              {/* 강렬한 경고 아이콘 */}
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-800 flex items-center justify-center animate-bounce">
              <Zap className="w-3 h-3 text-yellow-400" />
            </div>
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-xl font-semibold text-card-foreground animate-pulse">
              🚨 404 - 페이지를 찾을 수 없습니다
            </h2>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-red-700 rounded-full border border-red-900 animate-ping">
            <Slash className="w-4 h-4 text-white" />
            <span className="text-sm text-white font-semibold">
                            Coming Soon...
                        </span>
          </div>

          <div className="text-xs text-muted-foreground">
            추후 업데이트 예정
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

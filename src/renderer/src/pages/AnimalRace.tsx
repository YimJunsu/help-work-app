import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Users, Play, RotateCw } from 'lucide-react'

// 이모지 캐릭터
const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊']
const RESULT_EMOJIS = ['🎉', '🎊', '🎁', '💝', '🌟', '✨']

interface Ladder {
  horizontalLines: boolean[][]
}

// 사다리 생성
const generateLadder = (participants: number, rows: number): Ladder => {
  const horizontalLines: boolean[][] = []

  for (let row = 0; row < rows; row++) {
    const rowLines: boolean[] = []
    let lastHadLine = false

    for (let col = 0; col < participants - 1; col++) {
      // 연속된 가로선을 방지하면서 랜덤하게 생성
      if (!lastHadLine && Math.random() > 0.5) {
        rowLines.push(true)
        lastHadLine = true
      } else {
        rowLines.push(false)
        lastHadLine = false
      }
    }

    horizontalLines.push(rowLines)
  }

  return { horizontalLines }
}

// 사다리 타기 경로 계산
const calculatePath = (ladder: Ladder, startCol: number, participants: number): number[][] => {
  const path: number[][] = []
  let currentCol = startCol

  path.push([0, currentCol])

  for (let row = 0; row < ladder.horizontalLines.length; row++) {
    // 왼쪽 가로선 확인
    if (currentCol > 0 && ladder.horizontalLines[row][currentCol - 1]) {
      path.push([row + 0.5, currentCol - 0.5])
      currentCol--
    }
    // 오른쪽 가로선 확인
    else if (currentCol < participants - 1 && ladder.horizontalLines[row][currentCol]) {
      path.push([row + 0.5, currentCol + 0.5])
      currentCol++
    }

    path.push([row + 1, currentCol])
  }

  return path
}

export function AnimalRace() {
  const [participants, setParticipants] = useState(4)
  const [ladder, setLadder] = useState<Ladder | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)
  const [path, setPath] = useState<number[][] | null>(null)
  const [result, setResult] = useState<number | null>(null)

  const ROWS = 12
  const COL_WIDTH = 100
  const ROW_HEIGHT = 40

  // 새 사다리 생성
  const createNewLadder = () => {
    const newLadder = generateLadder(participants, ROWS)
    setLadder(newLadder)
    setIsPlaying(false)
    setSelectedPlayer(null)
    setPath(null)
    setResult(null)
  }

  // 초기 사다리 생성
  useEffect(() => {
    createNewLadder()
  }, [participants])

  // 플레이어 선택 및 경로 애니메이션
  const handlePlayerSelect = (playerIndex: number) => {
    if (!ladder || isPlaying) return

    setSelectedPlayer(playerIndex)
    setIsPlaying(true)

    const calculatedPath = calculatePath(ladder, playerIndex, participants)
    setPath(calculatedPath)

    // 애니메이션 후 결과 표시
    setTimeout(() => {
      const finalCol = calculatedPath[calculatedPath.length - 1][1]
      setResult(finalCol)
      setIsPlaying(false)
    }, calculatedPath.length * 100)
  }

  // 참가자 수 변경
  const changeParticipants = (count: number) => {
    if (count >= 2 && count <= 6 && !isPlaying) {
      setParticipants(count)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col justify-center">
              <CardTitle className="text-2xl font-bold text-card-foreground leading-tight">
                사다리타기
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                캐릭터를 선택하고 사다리를 타보세요!
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 참가자 수 선택 */}
          <div className="flex items-center gap-4 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">참가자 수:</span>
            </div>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((count) => (
                <Button
                  key={count}
                  size="sm"
                  variant={participants === count ? 'default' : 'outline'}
                  onClick={() => changeParticipants(count)}
                  disabled={isPlaying}
                >
                  {count}명
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={createNewLadder}
              disabled={isPlaying}
            >
              <RotateCw className="w-4 h-4 mr-2" />
              새 사다리
            </Button>
          </div>

          {/* 사다리타기 게임 */}
          {ladder && (
            <div className="flex flex-col items-center gap-4">
              {/* 시작 캐릭터 */}
              <div
                className="flex justify-around w-full"
                style={{ maxWidth: COL_WIDTH * participants }}
              >
                {Array.from({ length: participants }, (_, i) => (
                  <button
                    key={i}
                    className={`text-5xl transition-all hover:scale-110 ${
                      selectedPlayer === i ? 'scale-125' : ''
                    } ${result !== null && result === i ? 'animate-bounce' : ''}`}
                    onClick={() => handlePlayerSelect(i)}
                    disabled={isPlaying || result !== null}
                    style={{ width: COL_WIDTH }}
                  >
                    {EMOJIS[i]}
                  </button>
                ))}
              </div>

              {/* 사다리 */}
              <svg
                width={COL_WIDTH * participants}
                height={ROW_HEIGHT * (ROWS + 1)}
                className="border-2 border-border rounded-lg bg-card/50"
              >
                {/* 세로선 */}
                {Array.from({ length: participants }, (_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={COL_WIDTH * i + COL_WIDTH / 2}
                    y1={0}
                    x2={COL_WIDTH * i + COL_WIDTH / 2}
                    y2={ROW_HEIGHT * (ROWS + 1)}
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-border"
                  />
                ))}

                {/* 가로선 */}
                {ladder.horizontalLines.map((row, rowIndex) =>
                  row.map((hasLine, colIndex) =>
                    hasLine ? (
                      <line
                        key={`h-${rowIndex}-${colIndex}`}
                        x1={COL_WIDTH * colIndex + COL_WIDTH / 2}
                        y1={ROW_HEIGHT * (rowIndex + 1)}
                        x2={COL_WIDTH * (colIndex + 1) + COL_WIDTH / 2}
                        y2={ROW_HEIGHT * (rowIndex + 1)}
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-primary"
                      />
                    ) : null
                  )
                )}

                {/* 경로 애니메이션 */}
                {path && (
                  <polyline
                    points={path
                      .map(([row, col]) =>
                        `${COL_WIDTH * col + COL_WIDTH / 2},${ROW_HEIGHT * row}`
                      )
                      .join(' ')}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-secondary"
                    strokeDasharray={`${path.length * 50}`}
                    strokeDashoffset={`${path.length * 50}`}
                    style={{
                      animation: `drawPath ${path.length * 0.1}s linear forwards`
                    }}
                  />
                )}
              </svg>

              {/* 결과 */}
              <div
                className="flex justify-around w-full"
                style={{ maxWidth: COL_WIDTH * participants }}
              >
                {Array.from({ length: participants }, (_, i) => (
                  <div
                    key={i}
                    className={`text-5xl transition-all ${
                      result === i ? 'scale-125 animate-bounce' : ''
                    }`}
                    style={{ width: COL_WIDTH }}
                  >
                    {result === i && selectedPlayer !== null ? RESULT_EMOJIS[i] : ''}
                  </div>
                ))}
              </div>

              {/* 결과 메시지 */}
              {result !== null && selectedPlayer !== null && (
                <div className="text-center p-4 bg-primary/20 rounded-lg border border-primary">
                  <p className="text-lg font-bold text-primary">
                    {EMOJIS[selectedPlayer]} → {RESULT_EMOJIS[result]}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedPlayer === result ? '같은 자리!' : `${Math.abs(selectedPlayer - result)}칸 이동!`}
                  </p>
                </div>
              )}

              {/* 도움말 */}
              {!isPlaying && result === null && (
                <div className="text-center text-sm text-muted-foreground">
                  <Play className="w-4 h-4 inline mr-2" />
                  위의 캐릭터를 클릭하여 시작하세요
                </div>
              )}
            </div>
          )}

          {/* CSS 애니메이션 */}
          <style>{`
            @keyframes drawPath {
              to {
                stroke-dashoffset: 0;
              }
            }
          `}</style>
        </CardContent>
      </Card>
    </div>
  )
}
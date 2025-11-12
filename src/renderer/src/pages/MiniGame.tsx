import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { RotateCw, ArrowLeft, ArrowRight, ArrowDown, Play, Pause } from 'lucide-react'

// 테트리스 보드 크기
const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const CELL_SIZE = 30

// 테트로미노 모양 정의
const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: '#00f5ff' },
  O: { shape: [[1, 1], [1, 1]], color: '#ffd700' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a020f0' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00ff00' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff0000' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000ff' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#ff8c00' }
}

type TetrominoType = keyof typeof TETROMINOS
type Board = (string | null)[][]

interface Position {
  x: number
  y: number
}

interface Piece {
  shape: number[][]
  color: string
  position: Position
}

// 빈 보드 생성
const createEmptyBoard = (): Board => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
}

// 랜덤 테트로미노 생성
const getRandomTetromino = (): Piece => {
  const types = Object.keys(TETROMINOS) as TetrominoType[]
  const randomType = types[Math.floor(Math.random() * types.length)]
  const tetromino = TETROMINOS[randomType]

  return {
    shape: tetromino.shape,
    color: tetromino.color,
    position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 }
  }
}

// 충돌 감지
const checkCollision = (board: Board, piece: Piece, offset: Position = { x: 0, y: 0 }): boolean => {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.position.x + x + offset.x
        const newY = piece.position.y + y + offset.y

        if (
          newX < 0 ||
          newX >= BOARD_WIDTH ||
          newY >= BOARD_HEIGHT ||
          (newY >= 0 && board[newY][newX])
        ) {
          return true
        }
      }
    }
  }
  return false
}

// 피스를 보드에 합치기
const mergePieceToBoard = (board: Board, piece: Piece): Board => {
  const newBoard = board.map(row => [...row])

  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardY = piece.position.y + y
        const boardX = piece.position.x + x
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = piece.color
        }
      }
    }
  }

  return newBoard
}

// 완성된 라인 제거
const clearLines = (board: Board): { newBoard: Board; linesCleared: number } => {
  let linesCleared = 0
  const newBoard = board.filter(row => {
    if (row.every(cell => cell !== null)) {
      linesCleared++
      return false
    }
    return true
  })

  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null))
  }

  return { newBoard, linesCleared }
}

// 피스 회전
const rotatePiece = (piece: Piece): Piece => {
  const rotated = piece.shape[0].map((_, i) =>
    piece.shape.map(row => row[i]).reverse()
  )
  return { ...piece, shape: rotated }
}

export function MiniGame() {
  const [board, setBoard] = useState<Board>(createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState<Piece>(getRandomTetromino())
  const [nextPiece, setNextPiece] = useState<Piece>(getRandomTetromino())
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const dropIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 게임 속도 계산 (더 빠른 속도로 조정)
  const getDropSpeed = () => Math.max(50, 800 - (level - 1) * 150)

  // 피스 이동
  const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
    if (!isPlaying || isPaused || gameOver) return

    const offset = {
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
      down: { x: 0, y: 1 }
    }[direction]

    const newPiece = {
      ...currentPiece,
      position: {
        x: currentPiece.position.x + offset.x,
        y: currentPiece.position.y + offset.y
      }
    }

    if (!checkCollision(board, newPiece)) {
      setCurrentPiece(newPiece)
    } else if (direction === 'down') {
      // 피스를 보드에 고정
      const mergedBoard = mergePieceToBoard(board, currentPiece)
      const { newBoard, linesCleared } = clearLines(mergedBoard)

      setBoard(newBoard)
      setScore(prev => prev + linesCleared * 100 * level)

      if (linesCleared > 0 && score > 0 && score % 1000 < linesCleared * 100 * level) {
        setLevel(prev => prev + 1)
      }

      // 다음 피스로 전환
      if (checkCollision(newBoard, nextPiece)) {
        setGameOver(true)
        setIsPlaying(false)
      } else {
        setCurrentPiece(nextPiece)
        setNextPiece(getRandomTetromino())
      }
    }
  }, [board, currentPiece, nextPiece, isPlaying, isPaused, gameOver, level, score])

  // 피스 회전
  const handleRotate = useCallback(() => {
    if (!isPlaying || isPaused || gameOver) return

    const rotated = rotatePiece(currentPiece)
    if (!checkCollision(board, rotated)) {
      setCurrentPiece(rotated)
    }
  }, [board, currentPiece, isPlaying, isPaused, gameOver])

  // 하드 드롭
  const hardDrop = useCallback(() => {
    if (!isPlaying || isPaused || gameOver) return

    let newPiece = { ...currentPiece }
    while (!checkCollision(board, newPiece, { x: 0, y: 1 })) {
      newPiece.position.y++
    }

    const mergedBoard = mergePieceToBoard(board, newPiece)
    const { newBoard, linesCleared } = clearLines(mergedBoard)

    setBoard(newBoard)
    setScore(prev => prev + linesCleared * 100 * level + 20)

    if (linesCleared > 0 && score > 0 && score % 1000 < linesCleared * 100 * level) {
      setLevel(prev => prev + 1)
    }

    if (checkCollision(newBoard, nextPiece)) {
      setGameOver(true)
      setIsPlaying(false)
    } else {
      setCurrentPiece(nextPiece)
      setNextPiece(getRandomTetromino())
    }
  }, [board, currentPiece, nextPiece, isPlaying, isPaused, gameOver, level, score])

  // 키보드 입력 처리
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          movePiece('left')
          break
        case 'ArrowRight':
          e.preventDefault()
          movePiece('right')
          break
        case 'ArrowDown':
          e.preventDefault()
          movePiece('down')
          break
        case 'ArrowUp':
        case ' ':
          e.preventDefault()
          handleRotate()
          break
        case 'Enter':
          e.preventDefault()
          hardDrop()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, isPaused, gameOver, movePiece, handleRotate, hardDrop])

  // 자동 하강
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      dropIntervalRef.current = setInterval(() => {
        movePiece('down')
      }, getDropSpeed())
    }

    return () => {
      if (dropIntervalRef.current) {
        clearInterval(dropIntervalRef.current)
      }
    }
  }, [isPlaying, isPaused, gameOver, movePiece, level])

  // 게임 시작/재시작
  const startGame = () => {
    setBoard(createEmptyBoard())
    setCurrentPiece(getRandomTetromino())
    setNextPiece(getRandomTetromino())
    setScore(0)
    setLevel(1)
    setIsPlaying(true)
    setIsPaused(false)
    setGameOver(false)
  }

  // 일시정지
  const togglePause = () => {
    if (isPlaying && !gameOver) {
      setIsPaused(!isPaused)
    }
  }

  // 보드 렌더링 (현재 피스 포함)
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row])

    // 현재 피스를 보드에 표시
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y
            const boardX = currentPiece.position.x + x
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color
            }
          }
        }
      }
    }

    return displayBoard
  }

  const displayBoard = renderBoard()

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between min-h-[60px]">
            <div className="flex flex-col justify-center">
              <CardTitle className="text-2xl font-bold text-card-foreground leading-tight">
                테트리스
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                방향키로 조작, 스페이스로 회전, 엔터로 하드드롭
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-4 justify-center items-start flex-wrap">
            {/* 게임 보드 */}
            <div className="flex flex-col gap-2">
              <div
                className="border-2 border-border rounded-lg overflow-hidden shadow-2xl bg-black/80"
                style={{
                  width: BOARD_WIDTH * CELL_SIZE,
                  height: BOARD_HEIGHT * CELL_SIZE
                }}
              >
                {displayBoard.map((row, y) => (
                  <div key={y} className="flex">
                    {row.map((cell, x) => (
                      <div
                        key={`${y}-${x}`}
                        className="border border-gray-800"
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          backgroundColor: cell || '#1a1a1a',
                          boxShadow: cell ? `inset 0 0 10px ${cell}` : 'none'
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* 컨트롤 버튼 */}
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  onClick={() => movePiece('left')}
                  disabled={!isPlaying || isPaused || gameOver}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => movePiece('down')}
                  disabled={!isPlaying || isPaused || gameOver}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleRotate}
                  disabled={!isPlaying || isPaused || gameOver}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => movePiece('right')}
                  disabled={!isPlaying || isPaused || gameOver}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 사이드 패널 */}
            <div className="flex flex-col gap-4">
              {/* 점수판 */}
              <Card className="bg-card/50 border-border p-4 min-w-[200px]">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">점수</p>
                    <p className="text-2xl font-bold text-primary">{score}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">레벨</p>
                    <p className="text-xl font-bold text-secondary">{level}</p>
                  </div>
                </div>
              </Card>

              {/* 다음 블록 */}
              <Card className="bg-card/50 border-border p-4">
                <p className="text-sm text-muted-foreground mb-2">다음 블록</p>
                <div className="flex justify-center items-center bg-black/80 rounded p-2" style={{ minHeight: 80 }}>
                  {nextPiece && (
                    <div className="flex flex-col">
                      {nextPiece.shape.map((row, y) => (
                        <div key={y} className="flex">
                          {row.map((cell, x) => (
                            <div
                              key={`${y}-${x}`}
                              style={{
                                width: 20,
                                height: 20,
                                backgroundColor: cell ? nextPiece.color : 'transparent',
                                border: cell ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                boxShadow: cell ? `inset 0 0 10px ${nextPiece.color}` : 'none'
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* 게임 컨트롤 */}
              <div className="flex flex-col gap-2">
                {!isPlaying || gameOver ? (
                  <Button onClick={startGame} className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    {gameOver ? '다시 시작' : '게임 시작'}
                  </Button>
                ) : (
                  <Button onClick={togglePause} variant="outline" className="w-full">
                    <Pause className="w-4 h-4 mr-2" />
                    {isPaused ? '계속하기' : '일시정지'}
                  </Button>
                )}
                <Button
                  onClick={hardDrop}
                  variant="secondary"
                  disabled={!isPlaying || isPaused || gameOver}
                  className="w-full"
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  하드 드롭
                </Button>
              </div>

              {gameOver && (
                <div className="text-center p-4 bg-destructive/20 rounded-lg border border-destructive">
                  <p className="text-lg font-bold text-destructive">게임 오버!</p>
                  <p className="text-sm text-muted-foreground">최종 점수: {score}</p>
                </div>
              )}

              {isPaused && !gameOver && (
                <div className="text-center p-4 bg-primary/20 rounded-lg border border-primary">
                  <p className="text-lg font-bold text-primary">일시정지</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

export function DinoGame(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('dino-high-score')
    return saved ? parseInt(saved) : 0
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 게임 변수
    let animationId: number
    let isJumping = false
    let gravity = 0.6
    let jumpVelocity = 0
    let groundY = canvas.height - 50
    let dinoY = groundY
    let dinoX = 50
    let dinoWidth = 30
    let dinoHeight = 33
    let obstacles: Array<{ x: number; width: number; height: number }> = []
    let gameSpeed = 6
    let frameCount = 0
    let currentScore = 0
    let isGameOver = false
    let isRunning = false
    let obstacleFrequency = 100

    // 공룡 그리기
    const drawDino = () => {
      ctx.fillStyle = '#535353'
      // 몸통
      ctx.fillRect(dinoX, dinoY, dinoWidth, dinoHeight)
      // 머리
      ctx.fillRect(dinoX + 18, dinoY - 8, 12, 15)
      // 눈
      ctx.fillStyle = '#fff'
      ctx.fillRect(dinoX + 22, dinoY - 4, 4, 4)
      // 다리
      ctx.fillStyle = '#535353'
      const legOffset = Math.floor(frameCount / 5) % 2 === 0 ? 0 : 4
      ctx.fillRect(dinoX + 4, dinoY + dinoHeight, 6, 8 + legOffset)
      ctx.fillRect(dinoX + 18, dinoY + dinoHeight, 6, 8 - legOffset)
    }

    // 장애물 그리기
    const drawObstacles = () => {
      ctx.fillStyle = '#535353'
      obstacles.forEach((obstacle) => {
        ctx.fillRect(obstacle.x, groundY - obstacle.height, obstacle.width, obstacle.height)
      })
    }

    // 배경 그리기
    const drawGround = () => {
      ctx.strokeStyle = '#535353'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, groundY + dinoHeight + 5)
      ctx.lineTo(canvas.width, groundY + dinoHeight + 5)
      ctx.stroke()
    }

    // 점수 그리기
    const drawScore = () => {
      ctx.fillStyle = '#535353'
      ctx.font = '20px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`HI ${highScore.toString().padStart(5, '0')}`, canvas.width - 20, 30)
      ctx.fillText(currentScore.toString().padStart(5, '0'), canvas.width - 120, 30)
    }

    // 충돌 감지
    const checkCollision = () => {
      return obstacles.some((obstacle) => {
        return (
          dinoX < obstacle.x + obstacle.width &&
          dinoX + dinoWidth > obstacle.x &&
          dinoY < groundY - obstacle.height + dinoHeight &&
          dinoY + dinoHeight > groundY - obstacle.height
        )
      })
    }

    // 점프
    const jump = () => {
      if (!isJumping && dinoY === groundY) {
        isJumping = true
        jumpVelocity = -12
      }
    }

    // 게임 루프
    const gameLoop = () => {
      if (isGameOver || !isRunning) return

      // 캔버스 클리어
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 배경 그리기
      drawGround()

      // 점프 로직
      if (isJumping) {
        dinoY += jumpVelocity
        jumpVelocity += gravity

        if (dinoY >= groundY) {
          dinoY = groundY
          isJumping = false
          jumpVelocity = 0
        }
      }

      // 장애물 생성 (빈도 점점 증가)
      frameCount++
      if (frameCount % obstacleFrequency === 0) {
        const rand = Math.random()
        let height
        if (currentScore < 50) {
          height = rand > 0.5 ? 35 : 20
        } else if (currentScore < 150) {
          height = rand > 0.6 ? 40 : rand > 0.3 ? 25 : 15
        } else {
          height = rand > 0.7 ? 50 : rand > 0.4 ? 35 : rand > 0.2 ? 20 : 15
        }
        obstacles.push({
          x: canvas.width,
          width: 18,
          height: height
        })
      }

      // 장애물 이동
      obstacles = obstacles.filter((obstacle) => {
        obstacle.x -= gameSpeed
        return obstacle.x + obstacle.width > 0
      })

      // 점수 증가 및 난이도 조정
      if (frameCount % 10 === 0) {
        currentScore++
        setScore(currentScore)

        // 속도 점진적 증가 (더 빠르게)
        if (currentScore % 50 === 0 && gameSpeed < 15) {
          gameSpeed += 0.8
        }

        // 장애물 생성 빈도 증가 (더 자주 생성)
        if (currentScore % 80 === 0 && obstacleFrequency > 40) {
          obstacleFrequency -= 8
        }
      }

      // 충돌 감지
      if (checkCollision()) {
        isGameOver = true
        isRunning = false
        setGameOver(true)
        if (currentScore > highScore) {
          setHighScore(currentScore)
          localStorage.setItem('dino-high-score', currentScore.toString())
        }
        return
      }

      // 그리기
      drawDino()
      drawObstacles()
      drawScore()

      animationId = requestAnimationFrame(gameLoop)
    }

    // 게임 시작
    const startGame = () => {
      if (!isRunning) {
        isRunning = true
        isGameOver = false
        setGameStarted(true)
        setGameOver(false)
        gameLoop()
      }
    }

    // 재시작
    const restart = () => {
      isGameOver = false
      isJumping = false
      jumpVelocity = 0
      dinoY = groundY
      obstacles = []
      gameSpeed = 6
      frameCount = 0
      currentScore = 0
      obstacleFrequency = 100
      setScore(0)
      setGameOver(false)
      setGameStarted(true)
      startGame()
    }

    // 키보드 이벤트
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        if (!isRunning && !gameStarted) {
          startGame()
        } else if (isRunning && !isGameOver) {
          jump()
        } else if (isGameOver) {
          restart()
        }
      }
    }

    // 클릭 이벤트
    const handleClick = () => {
      if (!isRunning && !gameStarted) {
        startGame()
      } else if (isRunning && !isGameOver) {
        jump()
      } else if (isGameOver) {
        restart()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    canvas.addEventListener('click', handleClick)

    // 초기 화면 그리기
    drawGround()
    drawDino()
    drawScore()

    // 게임 시작된 상태면 게임 루프 시작
    if (gameStarted && !gameOver) {
      startGame()
    }

    return () => {
      isRunning = false
      window.removeEventListener('keydown', handleKeyDown)
      canvas.removeEventListener('click', handleClick)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [gameStarted, gameOver, highScore])

  const handleRestart = () => {
    setGameStarted(false)
    setGameOver(false)
    setScore(0)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <Card className="p-8 bg-card">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-foreground">Dino Game</h2>
          <canvas
            ref={canvasRef}
            width={600}
            height={180}
            className="border-2 border-border rounded-lg bg-background cursor-pointer"
          />
          <div className="flex gap-4 items-center">
            <p className="text-sm text-muted-foreground">
              {!gameStarted && 'Press SPACE or Click to Start'}
              {gameStarted && !gameOver && 'Press SPACE or Click to Jump'}
              {gameOver && 'Game Over! Press SPACE or Click to Restart'}
            </p>
          </div>
          {gameOver && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xl font-semibold text-foreground">
                Score: {score}
              </p>
              <Button onClick={handleRestart} variant="default">
                Restart
              </Button>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            High Score: {highScore}
          </div>
        </div>
      </Card>
    </div>
  )
}

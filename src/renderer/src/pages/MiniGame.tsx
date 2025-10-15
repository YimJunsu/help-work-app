import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Gamepad2 } from 'lucide-react'

export function MiniGame() {
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-[#1e1e2f] to-[#111] animate-bg">
      <Card className="flex-1 border-0 bg-card/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between min-h-[60px]">
            <div className="flex flex-col justify-center">
              <CardTitle className="text-2xl font-bold text-card-foreground leading-tight animate-fadeInUp">
                Mini Game
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 animate-fadeInUp delay-100">
                동물달리기 미니게임
              </p>
            </div>
            <div className="flex items-center gap-2 h-full">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-primary border border-border animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-secondary border border-border animate-ping" />
                <div className="w-3 h-3 rounded-full bg-accent border border-border animate-bounce" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center py-16 relative z-10">
            <Gamepad2 className="w-24 h-24 mx-auto mb-6 text-muted-foreground glowing-gamepad" />
            <h2 className="text-2xl font-bold text-card-foreground mb-2 typing-text">
              🚧 404 - 준비 중입니다!
            </h2>
            <p className="text-lg text-muted-foreground mb-4 animate-fadeInUp delay-300">
              커피내기 가능한 동물달리기 미니게임
            </p>
            <p className="text-sm text-muted-foreground animate-pulse delay-500">
              곧 만나요! 🎮
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 🔽 커스텀 스타일 직접 포함 */}
      <style>{`
        .glowing-gamepad {
          animation: shake 1s infinite alternate, glow 2s infinite ease-in-out;
        }

        @keyframes shake {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          50% { transform: rotate(-2deg); }
          75% { transform: rotate(1deg); }
          100% { transform: rotate(0deg); }
        }

        @keyframes glow {
          0% { filter: drop-shadow(0 0 0px #00f5ff); }
          50% { filter: drop-shadow(0 0 10px #00f5ff); }
          100% { filter: drop-shadow(0 0 0px #00f5ff); }
        }

        .typing-text {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid rgba(255,255,255,0.75);
          animation: typing 2.5s steps(30, end), blink 0.75s step-end infinite;
        }

        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }

        @keyframes blink {
          50% { border-color: transparent }
        }

        .animate-fadeInUp {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 1s forwards;
        }

        .animate-fadeInUp.delay-100 {
          animation-delay: 0.1s;
        }

        .animate-fadeInUp.delay-300 {
          animation-delay: 0.3s;
        }

        .animate-pulse.delay-500 {
          animation-delay: 0.5s;
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-bg {
          background-size: 200% 200%;
          animation: bgMove 10s ease infinite;
        }

        @keyframes bgMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}

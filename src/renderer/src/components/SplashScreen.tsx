import uniFightingLogo from "../assets/uni_fighting.png"

export function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-container">
        {/* 반짝이는 별들 */}
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>

        <div className="logo-container">
          <img src={uniFightingLogo} alt="Work Management" className="logo" />
        </div>

        <div className="title-container">
          <div className="title">Help Work App</div>
          <div className="subtitle">당신의 업무 도우미</div>
        </div>

        <div className="loader-container">
          <div className="loader">
            <div className="loader-bar"></div>
          </div>
          <div className="loading-text">잠시만 기다려주세요...</div>
        </div>

        <div className="version">v2.0.3</div>
      </div>

      <style>{`
        .splash-screen {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
          overflow: hidden;
          z-index: 9999;
          animation: fadeIn 0.3s ease-out;
        }

        .splash-screen::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          top: -200px;
          right: -200px;
          animation: float 15s ease-in-out infinite;
        }

        .splash-screen::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
          border-radius: 50%;
          bottom: -150px;
          left: -150px;
          animation: float 12s ease-in-out infinite reverse;
        }

        .splash-container {
          width: 90vw;
          max-width: 500px;
          height: 85vh;
          max-height: 650px;
          border-radius: 40px;
          overflow: visible;
          background: linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 250, 250, 0.95) 100%);
          backdrop-filter: blur(40px);
          box-shadow:
            0 30px 80px rgba(139, 92, 246, 0.3),
            0 0 0 1px rgba(139, 92, 246, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 1);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          z-index: 1;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: scale(1) translateY(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.05) translateY(-30px) rotate(5deg);
            opacity: 0.7;
          }
        }

        .star {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(139, 92, 246, 0.8);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.8);
          animation: twinkle 3s ease-in-out infinite;
        }

        .star:nth-child(1) { top: 15%; left: 20%; animation-delay: 0s; }
        .star:nth-child(2) { top: 25%; right: 15%; animation-delay: 0.5s; }
        .star:nth-child(3) { bottom: 30%; left: 25%; animation-delay: 1s; }
        .star:nth-child(4) { bottom: 20%; right: 20%; animation-delay: 1.5s; }
        .star:nth-child(5) { top: 40%; left: 10%; animation-delay: 2s; }
        .star:nth-child(6) { top: 60%; right: 10%; animation-delay: 2.5s; }

        @keyframes twinkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(0.7);
          }
        }

        .logo-container {
          position: relative;
          margin-bottom: 40px;
          animation: fadeInElement 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
        }

        .logo-container::before {
          content: '';
          position: absolute;
          inset: -30px;
          background: radial-gradient(circle, rgba(255, 182, 193, 0.4) 0%, rgba(173, 216, 230, 0.3) 50%, transparent 70%);
          border-radius: 50%;
          animation: logoGlow 3s ease-in-out infinite;
          z-index: -1;
        }

        .logo {
          width: 150px;
          height: 150px;
          border-radius: 35px;
          animation: logoFloat 4s ease-in-out infinite;
          box-shadow:
            0 20px 60px rgba(139, 92, 246, 0.4),
            0 0 0 3px rgba(255, 255, 255, 1),
            0 0 0 4px rgba(139, 92, 246, 0.2);
          transition: transform 0.3s ease;
          background: white;
          padding: 5px;
        }

        @keyframes logoGlow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(-1deg);
          }
          75% {
            transform: translateY(-10px) rotate(1deg);
          }
        }

        .title-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-bottom: 60px;
        }

        .title {
          font-size: 36px;
          font-weight: 900;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -1.5px;
          animation: fadeInElement 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s backwards;
          text-shadow: 0 4px 20px rgba(139, 92, 246, 0.2);
          filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15));
        }

        .subtitle {
          font-size: 13px;
          color: rgba(139, 92, 246, 0.7);
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 600;
          animation: fadeInElement 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s backwards;
        }

        .loader-container {
          width: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          animation: fadeInElement 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.8s backwards;
        }

        .loader {
          width: 100%;
          height: 6px;
          border-radius: 20px;
          overflow: hidden;
          background: rgba(139, 92, 246, 0.15);
          box-shadow: inset 0 2px 4px rgba(139, 92, 246, 0.1);
          position: relative;
          border: 2px solid rgba(139, 92, 246, 0.1);
        }

        .loader-bar {
          height: 100%;
          width: 45%;
          border-radius: 20px;
          background: linear-gradient(90deg,
            #FFB6C1 0%,
            #DDA0DD 25%,
            #9B88D9 50%,
            #87CEEB 75%,
            #98D8C8 100%);
          animation: loading 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
          box-shadow:
            0 0 20px rgba(255, 182, 193, 0.6),
            0 0 40px rgba(173, 216, 230, 0.4);
          position: relative;
        }

        .loader-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%);
          animation: shimmer 2s linear infinite;
        }

        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(320%);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        .loading-text {
          font-size: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
          letter-spacing: 0.5px;
          animation: blink 2s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(0.98);
          }
        }

        .version {
          position: absolute;
          bottom: 30px;
          font-size: 13px;
          color: #667eea;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 8px 18px;
          background: white;
          border-radius: 25px;
          border: 2px solid rgba(139, 92, 246, 0.2);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.15);
          backdrop-filter: blur(10px);
        }

        @keyframes fadeInElement {
          from {
            opacity: 0;
            transform: translateY(-15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
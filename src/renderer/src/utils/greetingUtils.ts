/**
 * 시간대와 생일에 따른 인사말을 반환하는 함수
 */
export interface GreetingMessage {
  message: string
  isSpecial: boolean
}

export function getGreetingMessage(
  userName: string | null,
  userBirthday: string | null
): GreetingMessage {
  const hour = new Date().getHours()
  const name = userName || '사용자'

  // 생일 체크
  if (userBirthday) {
    const today = new Date()
    const birthday = new Date(userBirthday)
    if (today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate()) {
      return {
        message: `생일 축하합니다 ${name}님! 🎉`,
        isSpecial: true
      }
    }
  }

  // 시간대별 인사말
  if (hour >= 5 && hour < 12) {
    return {
      message: `좋은 아침입니다 ${name}님! 좋은 하루 되세요 ☀️`,
      isSpecial: false
    }
  } else if (hour >= 12 && hour < 18) {
    return {
      message: `${name}님 반갑습니다! 😊`,
      isSpecial: false
    }
  } else {
    return {
      message: `${name}님 오늘도 고생하셨습니다 🌙`,
      isSpecial: false
    }
  }
}
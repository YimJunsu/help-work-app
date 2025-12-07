import { MapPin, Wind, Droplets, Loader2, CloudOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
} from "../ui/dialog"

interface WeatherData {
  location: string
  temperature: number
  feelsLike: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
}

interface WeeklyWeather {
  date: string
  weatherCode: number
  max: number
  min: number
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weekly, setWeekly] = useState<WeeklyWeather[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)   // 🔥 Dialog 상태 추가

  useEffect(() => {
    fetchWeather()
  }, [])

  const fetchWeather = async () => {
    try {
      setLoading(true)
      setError(null)

      let latitude: number
      let longitude: number

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 600000,
            enableHighAccuracy: false
          })
        })
        latitude = position.coords.latitude
        longitude = position.coords.longitude
      } catch {
        try {
          const ipResponse = await fetch('https://ipapi.co/json/')
          if (!ipResponse.ok) throw new Error('IP location failed')
          const ipData = await ipResponse.json()
          latitude = ipData.latitude
          longitude = ipData.longitude
        } catch {
          latitude = 37.5665
          longitude = 126.9780
        }
      }

      /** ---- 현재 날씨 ---- */
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
      )
      if (!weatherResponse.ok) throw new Error('날씨 정보를 가져올 수 없습니다')
      const weatherData = await weatherResponse.json()

      /** ---- 위치 이름 ---- */
      const locationResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ko`
      )
      let locationName = '현재 위치'
      if (locationResponse.ok) {
        const loc = await locationResponse.json()
        locationName =
          loc.address?.city ||
          loc.address?.town ||
          loc.address?.county ||
          loc.address?.state ||
          '현재 위치'
      }

      /** ---- 7일치 날씨 ---- */
      const weeklyResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      )
      const weeklyData = await weeklyResponse.json()

      const weeklyList: WeeklyWeather[] = weeklyData.daily.time.map(
        (date: string, i: number) => ({
          date,
          weatherCode: weeklyData.daily.weather_code[i],
          max: Math.round(weeklyData.daily.temperature_2m_max[i]),
          min: Math.round(weeklyData.daily.temperature_2m_min[i]),
        })
      )

      /** ---- 코드 맵 ---- */
      const weatherCodeMap: Record<number, string> = {
        0: '맑음',
        1: '대체로 맑음',
        2: '부분적으로 흐림',
        3: '흐림',
        45: '안개',
        48: '짙은 안개',
        51: '가랑비',
        53: '이슬비',
        55: '강한 이슬비',
        61: '약한 비',
        63: '비',
        65: '강한 비',
        71: '약한 눈',
        73: '눈',
        75: '강한 눈',
        77: '진눈깨비',
        80: '소나기',
        81: '강한 소나기',
        82: '폭우',
        95: '뇌우',
        96: '우박',
        99: '강한 우박'
      }

      const code = weatherData.current.weather_code
      const description = weatherCodeMap[code] ?? '알 수 없음'

      setWeather({
        location: locationName,
        temperature: Math.round(weatherData.current.temperature_2m),
        feelsLike: Math.round(weatherData.current.apparent_temperature),
        description,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        icon: getWeatherIcon(code)
      })

      setWeekly(weeklyList)
    } catch {
      setError('날씨 정보를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (code: number): string => {
    if (code === 0) return '☀️'
    if (code <= 3) return '🌤️'
    if (code <= 48) return '🌫️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '❄️'
    if (code <= 82) return '🌦️'
    return '⛈️'
  }

  /** ---- UI START ---- */

  /* 로딩 */
  if (loading) {
    return (
      <div className="w-full rounded-3xl p-6 bg-gradient-to-b from-blue-500/60 to-sky-500/50 backdrop-blur-xl border border-white/20 shadow-lg flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white" />
      </div>
    )
  }

  /* 에러 */
  if (error) {
    return (
      <div className="w-full rounded-3xl p-6 bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg text-center text-white">
        <CloudOff className="w-6 h-6 mx-auto mb-2 opacity-80" />
        <p className="text-sm font-medium">{error}</p>
        <button
          onClick={fetchWeather}
          className="mt-3 text-xs px-3 py-1 bg-white/20 rounded-full backdrop-blur-md border border-white/20 hover:bg-white/30 transition"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (!weather) return null

  return (
    <>
      {/* ---- Weather Widget (Click → Open Dialog) ---- */}
      <div
        onClick={() => setOpen(true)}
        className="
          w-full rounded-3xl p-4 cursor-pointer
          bg-gradient-to-b from-blue-500/70 to-blue-600/70
          dark:from-blue-800/50 dark:to-blue-900/50
          text-white shadow-xl backdrop-blur-2xl border border-white/20
          active:scale-[0.98] transition
        "
      >
        <div className="flex justify-end mb-1">
          <p className="text-[10px] opacity-70">
            위치정보는 정확하지 않을 수 있습니다
          </p>
        </div>

        <div className="mb-3">
          <p className="text-base font-semibold flex items-center gap-1">
            <MapPin className="w-4 h-4 opacity-80" />
            {weather.location}
          </p>
          <p className="text-[13px] opacity-80 mt-0.5">{weather.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-5xl font-light">{weather.temperature}°</p>
            <p className="text-xs opacity-80 mt-1">체감 {weather.feelsLike}°</p>
          </div>
          <div className="text-5xl">{weather.icon}</div>
        </div>

        <div className="w-full h-px bg-white/20 my-3" />

        <div className="flex justify-between text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs opacity-80">습도</span>
            <div className="flex items-center gap-1 text-white">
              <Droplets className="w-3 h-3" />
              {weather.humidity}%
            </div>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-xs opacity-80">풍속</span>
            <div className="flex items-center gap-1 justify-end">
              <Wind className="w-3 h-3" />
              {weather.windSpeed} km/h
            </div>
          </div>
        </div>
      </div>

      {/* ---- Dialog (7일치 날씨) ---- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[28px] p-0 bg-gradient-to-b from-blue-400/95 to-blue-500/95 dark:from-blue-900/95 dark:to-blue-950/95 backdrop-blur-3xl border-0 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-2 text-white/90 mb-1">
              <MapPin className="w-4 h-4" />
              <p className="text-sm font-medium">{weather.location}</p>
            </div>
            <h2 className="text-2xl font-semibold text-white">7일간의 일기예보</h2>
          </div>

          {/* Weekly List */}
          <div className="px-4 pb-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-[20px] overflow-hidden border border-white/20 shadow-inner">
              {weekly.map((day, i) => {
                const date = new Date(day.date)
                const isToday = i === 0
                const dayName = isToday
                  ? '오늘'
                  : ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`

                // Calculate temperature bar width
                const minTemp = Math.min(...weekly.map((d) => d.min))
                const maxTemp = Math.max(...weekly.map((d) => d.max))
                const tempRange = maxTemp - minTemp
                const barWidth = tempRange > 0
                  ? ((day.max - day.min) / tempRange) * 100
                  : 50

                return (
                  <div
                    key={i}
                    className={`
                      flex items-center justify-between px-4 py-3.5
                      ${i !== weekly.length - 1 ? 'border-b border-white/10' : ''}
                      hover:bg-white/5 transition-colors
                    `}
                  >
                    {/* Left: Day */}
                    <div className="flex-1">
                      <p className="text-white font-semibold text-base">
                        {isToday ? dayName : `${dayName}요일`}
                      </p>
                      {!isToday && (
                        <p className="text-white/60 text-xs mt-0.5">{dateStr}</p>
                      )}
                    </div>

                    {/* Center: Icon */}
                    <div className="flex-1 flex justify-center">
                      <span className="text-3xl drop-shadow-lg">
                        {getWeatherIcon(day.weatherCode)}
                      </span>
                    </div>

                    {/* Right: Temperature */}
                    <div className="flex-1 flex items-center justify-end gap-3">
                      <span className="text-white/60 text-base font-medium min-w-[32px] text-right">
                        {day.min}°
                      </span>
                      <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-300 to-orange-400 rounded-full transition-all"
                          style={{ width: `${Math.max(barWidth, 20)}%` }}
                        />
                      </div>
                      <span className="text-white text-base font-semibold min-w-[32px]">
                        {day.max}°
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer Info */}
          <div className="px-6 pb-5 pt-2">
            <p className="text-white/50 text-xs text-center">
              Open-Meteo 제공 • 마지막 업데이트: {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

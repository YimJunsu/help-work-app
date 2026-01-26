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
  locationSource: 'gps' | 'ip' | 'default'
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
      let locationSource: 'gps' | 'ip' | 'default' = 'default'

      // 1순위: Browser Geolocation API (가장 정확)
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'))
            return
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,          // 10초로 증가 (정확도를 위해)
            maximumAge: 0,           // 캐시 사용 안함 (항상 최신 위치)
            enableHighAccuracy: true // 고정밀도 모드 활성화
          })
        })
        latitude = position.coords.latitude
        longitude = position.coords.longitude
        locationSource = 'gps'
        console.log('✅ Using Browser Geolocation API (High Accuracy):', {
          latitude,
          longitude,
          accuracy: position.coords.accuracy
        })
      } catch (geoError) {
        console.log('⚠️ Browser Geolocation failed, trying IP-based location...', geoError)

        // 2순위: IP 기반 위치 (ipapi.co -> ip-api.com -> 기본값)
        try {
          // ipapi.co 시도
          const ipResponse = await fetch('https://ipapi.co/json/')
          if (!ipResponse.ok) throw new Error('ipapi.co failed')
          const ipData = await ipResponse.json()

          // 에러 응답 체크
          if (ipData.error) {
            throw new Error(ipData.reason || 'ipapi.co error')
          }

          latitude = ipData.latitude
          longitude = ipData.longitude
          locationSource = 'ip'
          console.log('✅ Using ipapi.co:', { latitude, longitude })
        } catch (ipError1) {
          console.log('⚠️ ipapi.co failed, trying ip-api.com...')

          try {
            // ip-api.com 시도 (무료, 제한 있음)
            const ipResponse2 = await fetch('http://ip-api.com/json/')
            if (!ipResponse2.ok) throw new Error('ip-api.com failed')
            const ipData2 = await ipResponse2.json()

            if (ipData2.status === 'fail') {
              throw new Error(ipData2.message || 'ip-api.com error')
            }

            latitude = ipData2.lat
            longitude = ipData2.lon
            locationSource = 'ip'
            console.log('✅ Using ip-api.com:', { latitude, longitude })
          } catch (ipError2) {
            // 모든 방법 실패 시 서울을 기본값으로 사용
            console.log('⚠️ All location methods failed, using default (Seoul)')
            latitude = 37.5665
            longitude = 126.9780
            locationSource = 'default'
          }
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
        icon: getWeatherIcon(code),
        locationSource
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
      <div className="w-full rounded-3xl p-6 bg-gradient-to-b from-slate-100/80 to-slate-200/70 dark:from-slate-800/70 dark:to-slate-900/60 backdrop-blur-xl border border-slate-200/40 dark:border-slate-700/30 shadow-lg flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-600 dark:text-slate-400" />
      </div>
    )
  }

  /* 에러 */
  if (error) {
    return (
      <div className="w-full rounded-3xl p-6 bg-slate-100/80 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/40 dark:border-slate-700/30 shadow-lg text-center">
        <CloudOff className="w-6 h-6 mx-auto mb-2 opacity-60 text-slate-600 dark:text-slate-400" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{error}</p>
        <button
          onClick={fetchWeather}
          className="mt-3 text-xs px-3 py-1 bg-slate-200/80 dark:bg-slate-700/80 rounded-full backdrop-blur-md border border-slate-300/40 dark:border-slate-600/40 hover:bg-slate-300/80 dark:hover:bg-slate-600/80 transition text-slate-700 dark:text-slate-300"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (!weather) return null

  const getLocationSourceLabel = () => {
    switch (weather.locationSource) {
      case 'gps':
        return { text: 'GPS 위치', emoji: '📍', accurate: true }
      case 'ip':
        return { text: 'IP 기반 위치', emoji: '🌐', accurate: false }
      case 'default':
        return { text: '기본 위치 (서울)', emoji: '📌', accurate: false }
    }
  }

  const locationInfo = getLocationSourceLabel()

  return (
    <>
      {/* ---- Weather Widget (Click → Open Dialog) ---- */}
      <div
        onClick={() => setOpen(true)}
        className="
          w-full rounded-3xl p-4 cursor-pointer
          bg-gradient-to-b from-slate-100/90 to-slate-200/80
          dark:from-slate-800/70 dark:to-slate-900/60
          text-slate-800 dark:text-slate-100 shadow-xl backdrop-blur-2xl border border-slate-200/40 dark:border-slate-700/30
          hover:shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300
        "
      >
        <div className="flex justify-between items-center mb-1">
          <div className="px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700/60 backdrop-blur-md border border-slate-300/40 dark:border-slate-600/40">
            <p className="text-[10px] font-medium flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <span>{locationInfo.emoji}</span>
              <span>{locationInfo.text}</span>
            </p>
          </div>
          {!locationInfo.accurate && (
            <p className="text-[9px] opacity-60 text-slate-600 dark:text-slate-400">
              정확하지 않을 수 있음
            </p>
          )}
        </div>

        <div className="mb-3">
          <p className="text-base font-semibold flex items-center gap-1 text-slate-800 dark:text-slate-100">
            <MapPin className="w-4 h-4 opacity-70" />
            {weather.location}
          </p>
          <p className="text-[13px] opacity-70 mt-0.5 text-slate-700 dark:text-slate-300">{weather.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-5xl font-light text-slate-900 dark:text-slate-50">{weather.temperature}°</p>
            <p className="text-xs opacity-70 mt-1 text-slate-700 dark:text-slate-300">체감 {weather.feelsLike}°</p>
          </div>
          <div className="text-5xl drop-shadow-sm">{weather.icon}</div>
        </div>

        <div className="w-full h-px bg-slate-300/30 dark:bg-slate-600/30 my-3" />

        <div className="flex justify-between text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs opacity-70 text-slate-600 dark:text-slate-400">습도</span>
            <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200">
              <Droplets className="w-3 h-3" />
              {weather.humidity}%
            </div>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-xs opacity-70 text-slate-600 dark:text-slate-400">풍속</span>
            <div className="flex items-center gap-1 justify-end text-slate-800 dark:text-slate-200">
              <Wind className="w-3 h-3" />
              {weather.windSpeed} km/h
            </div>
          </div>
        </div>
      </div>

      {/* ---- Dialog (7일치 날씨) ---- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[28px] p-0 bg-gradient-to-b from-slate-100/98 to-slate-200/98 dark:from-slate-800/98 dark:to-slate-900/98 backdrop-blur-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <MapPin className="w-4 h-4" />
                <p className="text-sm font-medium">{weather.location}</p>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700/60 backdrop-blur-md border border-slate-300/40 dark:border-slate-600/40">
                <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>{locationInfo.emoji}</span>
                  <span>{locationInfo.text}</span>
                </p>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">7일간의 일기예보</h2>
          </div>

          {/* Weekly List */}
          <div className="px-4 pb-4">
            <div className="bg-slate-50/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[20px] overflow-hidden border border-slate-200/40 dark:border-slate-700/40 shadow-inner">
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
                      ${i !== weekly.length - 1 ? 'border-b border-slate-200/40 dark:border-slate-700/40' : ''}
                      hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors
                    `}
                  >
                    {/* Left: Day */}
                    <div className="flex-1">
                      <p className="text-slate-800 dark:text-slate-100 font-semibold text-base">
                        {isToday ? dayName : `${dayName}요일`}
                      </p>
                      {!isToday && (
                        <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">{dateStr}</p>
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
                      <span className="text-slate-600 dark:text-slate-400 text-base font-medium min-w-[32px] text-right">
                        {day.min}°
                      </span>
                      <div className="w-16 h-1.5 bg-slate-300/40 dark:bg-slate-600/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-700 rounded-full transition-all"
                          style={{ width: `${Math.max(barWidth, 20)}%` }}
                        />
                      </div>
                      <span className="text-slate-800 dark:text-slate-200 text-base font-semibold min-w-[32px]">
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
            <p className="text-slate-500 dark:text-slate-400 text-xs text-center">
              Open-Meteo 제공 • 마지막 업데이트: {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {!locationInfo.accurate && (
              <p className="text-slate-400 dark:text-slate-500 text-[10px] text-center mt-1">
                💡 더 정확한 위치를 위해 브라우저에서 위치 권한을 허용해주세요
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

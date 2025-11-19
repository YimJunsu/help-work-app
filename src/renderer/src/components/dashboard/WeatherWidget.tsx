import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Cloud, MapPin, Wind, Droplets, Loader2, CloudOff } from 'lucide-react'
import { useState, useEffect } from 'react'

interface WeatherData {
  location: string
  temperature: number
  feelsLike: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWeather()
  }, [])

  const fetchWeather = async () => {
    try {
      setLoading(true)
      setError(null)

      let latitude: number
      let longitude: number

      // Try to get user's location via Geolocation API
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 600000, // 10 minutes cache
            enableHighAccuracy: false
          })
        })
        latitude = position.coords.latitude
        longitude = position.coords.longitude
      } catch (geoError) {
        console.log('Geolocation failed, trying IP-based location...', geoError)

        // Fallback to IP-based location
        try {
          const ipResponse = await fetch('https://ipapi.co/json/')
          if (!ipResponse.ok) throw new Error('IP location failed')
          const ipData = await ipResponse.json()
          latitude = ipData.latitude
          longitude = ipData.longitude
        } catch (ipError) {
          // Use Seoul as default fallback
          console.log('IP location failed, using Seoul as default')
          latitude = 37.5665
          longitude = 126.9780
        }
      }

      // Fetch weather data using Open-Meteo API (free, no API key required)
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
      )

      if (!weatherResponse.ok) {
        throw new Error('날씨 정보를 가져올 수 없습니다')
      }

      const weatherData = await weatherResponse.json()

      // Get location name using reverse geocoding
      const locationResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ko`
      )

      let locationName = '현재 위치'
      if (locationResponse.ok) {
        const locationData = await locationResponse.json()
        locationName = locationData.address?.city ||
                      locationData.address?.town ||
                      locationData.address?.county ||
                      locationData.address?.state ||
                      '현재 위치'
      }

      // Map weather codes to descriptions
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
        96: '우박을 동반한 뇌우',
        99: '강한 우박을 동반한 뇌우'
      }

      const weatherCode = weatherData.current.weather_code
      const description = weatherCodeMap[weatherCode] || '알 수 없음'

      setWeather({
        location: locationName,
        temperature: Math.round(weatherData.current.temperature_2m),
        feelsLike: Math.round(weatherData.current.apparent_temperature),
        description,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        icon: getWeatherIcon(weatherCode)
      })
    } catch (err) {
      console.error('Weather fetch error:', err)
      setError('날씨 정보를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (code: number): string => {
    if (code === 0) return '☀️'
    if (code <= 3) return '⛅'
    if (code <= 48) return '🌫️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '❄️'
    if (code <= 82) return '🌦️'
    return '⛈️'
  }

  if (loading) {
    return (
      <Card className="border border-border/50 bg-gradient-to-br from-blue-50/50 to-sky-50/50 dark:from-blue-950/30 dark:to-sky-950/30 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">날씨 정보를 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-border/50 bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-950/30 dark:to-slate-950/30 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <CloudOff className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm font-medium">{error}</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              위치 권한을 확인해주세요
            </p>
            <button
              onClick={fetchWeather}
              className="mt-3 px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weather) return null

  return (
    <Card className="border border-border/50 bg-gradient-to-br from-blue-50/50 to-sky-50/50 dark:from-blue-950/30 dark:to-sky-950/30 shadow-sm hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Cloud className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-card-foreground">
              현재 날씨
            </CardTitle>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{weather.location}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {/* 온도 및 날씨 상태 */}
          <div className="flex items-center gap-4">
            <div className="text-6xl">{weather.icon}</div>
            <div>
              <div className="text-4xl font-bold text-card-foreground">
                {weather.temperature}°C
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {weather.description}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                체감 {weather.feelsLike}°C
              </p>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="space-y-3 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-muted-foreground">습도</span>
              <div className="flex items-center gap-1">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold">{weather.humidity}%</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-muted-foreground">풍속</span>
              <div className="flex items-center gap-1">
                <Wind className="w-4 h-4 text-sky-500" />
                <span className="text-sm font-semibold">{weather.windSpeed} km/h</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">※ 위치정보는 정확하지 않을 수 있습니다.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Euro, Loader2, RefreshCw, Wallet, ChevronDown, Info } from 'lucide-react'
import { Button } from '../components/ui/button'

interface ExchangeRateData {
  currency: string
  name: string
  rate: number
  change: number
  icon: React.ElementType
  color: string
}

export function ExchangeRate() {
  const [rates, setRates] = useState<ExchangeRateData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  const fetchExchangeRates = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // ExchangeRate-API 사용 (무료)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/KRW')

      if (!response.ok) {
        throw new Error('환율 정보를 가져올 수 없습니다')
      }

      const data = await response.json()

      // 주요 통화의 원화 대비 환율 계산
      const usdRate = 1 / data.rates.USD
      const eurRate = 1 / data.rates.EUR
      const jpyRate = 100 / data.rates.JPY // 100엔 기준
      const cnyRate = 1 / data.rates.CNY

      // 이전 데이터와 비교하여 변동률 계산 (간단하게 랜덤으로 표시)
      const exchangeRates: ExchangeRateData[] = [
        {
          currency: 'USD',
          name: '미국 달러',
          rate: usdRate,
          change: (Math.random() - 0.5) * 2, // -1 ~ 1 사이 랜덤
          icon: DollarSign,
          color: 'text-green-600 dark:text-green-400'
        },
        {
          currency: 'EUR',
          name: '유로',
          rate: eurRate,
          change: (Math.random() - 0.5) * 2,
          icon: Euro,
          color: 'text-blue-600 dark:text-blue-400'
        },
        {
          currency: 'JPY',
          name: '일본 엔 (100엔)',
          rate: jpyRate,
          change: (Math.random() - 0.5) * 2,
          icon: Wallet,
          color: 'text-red-600 dark:text-red-400'
        },
        {
          currency: 'CNY',
          name: '중국 위안',
          rate: cnyRate,
          change: (Math.random() - 0.5) * 2,
          icon: Wallet,
          color: 'text-orange-600 dark:text-orange-400'
        }
      ]

      setRates(exchangeRates)
      setLastUpdate(new Date().toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }))
    } catch (err) {
      console.error('Exchange rate fetch error:', err)
      setError('환율 정보를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchExchangeRates()
    // 5분마다 자동 갱신
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">환율 정보</CardTitle>
                {lastUpdate && (
                  <p className="text-sm text-muted-foreground mt-1">
                    마지막 업데이트: {lastUpdate}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={fetchExchangeRates}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading && rates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">환율 정보를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="p-4 rounded-full bg-destructive/10 mb-4">
                <DollarSign className="w-12 h-12 text-destructive" />
              </div>
              <p className="text-destructive font-medium mb-2">{error}</p>
              <Button onClick={fetchExchangeRates} variant="outline" size="sm">
                다시 시도
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rates.map((rate) => {
                const Icon = rate.icon
                const isPositive = rate.change >= 0

                return (
                  <div
                    key={rate.currency}
                    className="
                      p-6 rounded-3xl
                      bg-gradient-to-b from-white/40 to-white/20
                      dark:from-slate-800/40 dark:to-slate-900/20
                      backdrop-blur-2xl border border-white/20 shadow-lg
                      hover:shadow-xl transition-all duration-200
                    "
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md">
                          <Icon className={`w-6 h-6 ${rate.color}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                            {rate.currency}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {rate.name}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                        isPositive
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}>
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="text-xs font-semibold">
                          {Math.abs(rate.change).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                        ₩{rate.rate.toLocaleString('ko-KR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        1 {rate.currency} = {rate.rate.toFixed(2)} KRW
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 안내 정보 */}
          <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              💡 <strong>참고:</strong> 환율 정보는 5분마다 자동으로 갱신됩니다.
              실시간 환율이 아니며 참고용으로만 사용하세요.
            </p>
          </div>

          {/* 환율 정보 출처 및 방식 (토글) */}
          <div className="mt-4">
            <button
              onClick={() => setIsInfoOpen(!isInfoOpen)}
              className="
                w-full p-4 rounded-2xl
                bg-gradient-to-b from-blue-50/50 to-blue-100/30
                dark:from-blue-900/20 dark:to-blue-900/10
                border border-blue-200 dark:border-blue-800
                hover:bg-blue-100/40 dark:hover:bg-blue-900/30
                transition-all duration-200
                flex items-center justify-between
              "
            >
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  환율 정보 출처 및 데이터 수집 방식
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform duration-200 ${
                  isInfoOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isInfoOpen && (
              <div className="mt-2 p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-blue-200 dark:border-blue-800 backdrop-blur-sm">
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  {/* 출처 */}
                  <div>
                    <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      데이터 출처
                    </h4>
                    <p className="ml-6">
                      <strong>ExchangeRate-API</strong> (
                      <a
                        href="https://www.exchangerate-api.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        https://www.exchangerate-api.com/
                      </a>
                      )
                    </p>
                    <p className="ml-6 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      무료 환율 API 서비스로, 신뢰할 수 있는 금융 데이터 제공업체로부터 환율 정보를 수집합니다.
                    </p>
                  </div>

                  {/* 수집 방식 */}
                  <div>
                    <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      데이터 수집 방식
                    </h4>
                    <ul className="ml-6 space-y-2 list-disc list-inside">
                      <li>
                        <strong>API 엔드포인트:</strong>{' '}
                        <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                          https://api.exchangerate-api.com/v4/latest/KRW
                        </code>
                      </li>
                      <li>
                        <strong>기준 통화:</strong> KRW (대한민국 원)
                      </li>
                      <li>
                        <strong>갱신 주기:</strong> 5분마다 자동 갱신 (페이지 로드 시 초기 1회 + 자동 갱신)
                      </li>
                      <li>
                        <strong>계산 방식:</strong> API에서 받은 환율을 역수로 계산하여 원화 기준 환율로 변환
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-5">
                          예시: 1 USD = 1,300 KRW → API 응답: KRW to USD = 0.00077 → 1 / 0.00077 ≈ 1,300
                        </div>
                      </li>
                      <li>
                        <strong>지원 통화:</strong>
                        <ul className="ml-5 mt-1 space-y-1">
                          <li>• USD (미국 달러)</li>
                          <li>• EUR (유로)</li>
                          <li>• JPY (일본 엔 - 100엔 기준)</li>
                          <li>• CNY (중국 위안)</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  {/* 참고사항 */}
                  <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ⚠️ <strong>주의:</strong> 이 환율 정보는 참고용이며, 실제 금융 거래 시에는 해당 금융기관의 고시 환율을 확인하시기 바랍니다.
                      변동률은 참고용 랜덤 값이며 실제 시장 변동을 반영하지 않습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
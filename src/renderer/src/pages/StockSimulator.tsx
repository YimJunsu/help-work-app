import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { TrendingUp, TrendingDown, Wallet, BarChart3, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Label } from '../components/ui/label'

interface Stock {
  id: string
  name: string
  symbol: string
  price: number
  previousPrice: number
  changePercent: number
}

interface Portfolio {
  [stockId: string]: {
    quantity: number
    averagePrice: number
  }
}

interface TradeDialogState {
  isOpen: boolean
  stock: Stock | null
  type: 'buy' | 'sell'
}

const INITIAL_CASH = 300000
const STOCK_UPDATE_INTERVAL = 2000 // 2초마다 주가 업데이트

// 초기 주식 목록
const INITIAL_STOCKS: Stock[] = [
  { id: '1', name: '삼성전자', symbol: 'SAMSUNG', price: 70000, previousPrice: 70000, changePercent: 0 },
  { id: '2', name: 'SK하이닉스', symbol: 'SKHYNIX', price: 125000, previousPrice: 125000, changePercent: 0 },
  { id: '3', name: '네이버', symbol: 'NAVER', price: 210000, previousPrice: 210000, changePercent: 0 },
  { id: '4', name: '카카오', symbol: 'KAKAO', price: 52000, previousPrice: 52000, changePercent: 0 },
  { id: '5', name: '현대차', symbol: 'HYUNDAI', price: 180000, previousPrice: 180000, changePercent: 0 },
  { id: '6', name: 'LG에너지솔루션', symbol: 'LGES', price: 420000, previousPrice: 420000, changePercent: 0 },
  { id: '7', name: 'KB금융', symbol: 'KBFG', price: 62000, previousPrice: 62000, changePercent: 0 },
  { id: '8', name: '셀트리온', symbol: 'CELLTRION', price: 178000, previousPrice: 178000, changePercent: 0 },
]

export function StockSimulator() {
  const [cash, setCash] = useState(INITIAL_CASH)
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS)
  const [portfolio, setPortfolio] = useState<Portfolio>({})
  const [tradeDialog, setTradeDialog] = useState<TradeDialogState>({
    isOpen: false,
    stock: null,
    type: 'buy'
  })
  const [tradeQuantity, setTradeQuantity] = useState(1)
  const [isRunning, setIsRunning] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 실시간 주가 변동
  useEffect(() => {
    if (!isRunning) return

    const updateStockPrices = () => {
      setStocks(prevStocks =>
        prevStocks.map(stock => {
          // -3% ~ +3% 범위에서 랜덤하게 변동
          const changePercent = (Math.random() - 0.5) * 6
          const priceChange = stock.price * (changePercent / 100)
          const newPrice = Math.max(1000, Math.round(stock.price + priceChange))

          return {
            ...stock,
            previousPrice: stock.price,
            price: newPrice,
            changePercent: ((newPrice - stock.previousPrice) / stock.previousPrice) * 100
          }
        })
      )
    }

    intervalRef.current = setInterval(updateStockPrices, STOCK_UPDATE_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  // 포트폴리오 총 가치 계산
  const portfolioValue = Object.entries(portfolio).reduce((total, [stockId, holding]) => {
    const stock = stocks.find(s => s.id === stockId)
    return total + (stock ? stock.price * holding.quantity : 0)
  }, 0)

  // 총 자산 계산
  const totalAssets = cash + portfolioValue

  // 수익률 계산
  const profitRate = ((totalAssets - INITIAL_CASH) / INITIAL_CASH) * 100

  // 매수 처리
  const handleBuy = () => {
    if (!tradeDialog.stock) return

    const totalCost = tradeDialog.stock.price * tradeQuantity

    if (totalCost > cash) {
      alert('현금이 부족합니다!')
      return
    }

    setCash(prev => prev - totalCost)

    setPortfolio(prev => {
      const existing = prev[tradeDialog.stock!.id]
      if (existing) {
        const totalQuantity = existing.quantity + tradeQuantity
        const totalCost = (existing.averagePrice * existing.quantity) + (tradeDialog.stock!.price * tradeQuantity)
        return {
          ...prev,
          [tradeDialog.stock!.id]: {
            quantity: totalQuantity,
            averagePrice: totalCost / totalQuantity
          }
        }
      } else {
        return {
          ...prev,
          [tradeDialog.stock!.id]: {
            quantity: tradeQuantity,
            averagePrice: tradeDialog.stock!.price
          }
        }
      }
    })

    setTradeDialog({ isOpen: false, stock: null, type: 'buy' })
    setTradeQuantity(1)
  }

  // 매도 처리
  const handleSell = () => {
    if (!tradeDialog.stock) return

    const holding = portfolio[tradeDialog.stock.id]
    if (!holding || holding.quantity < tradeQuantity) {
      alert('보유 수량이 부족합니다!')
      return
    }

    const totalRevenue = tradeDialog.stock.price * tradeQuantity
    setCash(prev => prev + totalRevenue)

    setPortfolio(prev => {
      const newQuantity = holding.quantity - tradeQuantity
      if (newQuantity === 0) {
        const { [tradeDialog.stock!.id]: _, ...rest } = prev
        return rest
      } else {
        return {
          ...prev,
          [tradeDialog.stock!.id]: {
            ...holding,
            quantity: newQuantity
          }
        }
      }
    })

    setTradeDialog({ isOpen: false, stock: null, type: 'buy' })
    setTradeQuantity(1)
  }

  // 거래 다이얼로그 열기
  const openTradeDialog = (stock: Stock, type: 'buy' | 'sell') => {
    setTradeDialog({ isOpen: true, stock, type })
    setTradeQuantity(1)
  }

  // 숫자 포맷팅 함수
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num))
  }

  // 가격 변동 색상 결정
  const getPriceColor = (changePercent: number) => {
    if (changePercent > 0) return 'text-red-500'
    if (changePercent < 0) return 'text-blue-500'
    return 'text-muted-foreground'
  }

  // 리셋 기능
  const handleReset = () => {
    if (confirm('정말 초기화하시겠습니까? 모든 데이터가 삭제됩니다.')) {
      setCash(INITIAL_CASH)
      setPortfolio({})
      setStocks(INITIAL_STOCKS)
    }
  }

  return (
    <div className="space-y-6">
      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">보유 현금</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(cash)}원</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">포트폴리오 가치</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(portfolioValue)}원</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 자산 / 수익률</CardTitle>
            {profitRate >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-blue-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalAssets)}원</div>
            <p className={`text-xs ${profitRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
              {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex gap-2">
        <Button
          variant={isRunning ? 'destructive' : 'default'}
          onClick={() => setIsRunning(!isRunning)}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? '일시정지' : '시작'}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          초기화
        </Button>
      </div>

      {/* 주식 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>주식 목록</CardTitle>
          <CardDescription>실시간으로 변동하는 주가를 확인하고 거래하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stocks.map(stock => {
              const holding = portfolio[stock.id]
              const profitLoss = holding
                ? (stock.price - holding.averagePrice) * holding.quantity
                : 0
              const profitLossPercent = holding
                ? ((stock.price - holding.averagePrice) / holding.averagePrice) * 100
                : 0

              return (
                <div
                  key={stock.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{stock.name}</h3>
                      <Badge variant="outline" className="text-xs">{stock.symbol}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className={`text-lg font-bold ${getPriceColor(stock.changePercent)}`}>
                        {formatNumber(stock.price)}원
                      </span>
                      <span className={`text-sm ${getPriceColor(stock.changePercent)}`}>
                        {stock.changePercent >= 0 ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    {holding && (
                      <div className="text-sm text-muted-foreground mt-1">
                        보유: {holding.quantity}주 (평균 {formatNumber(holding.averagePrice)}원) |
                        <span className={profitLoss >= 0 ? 'text-red-500' : 'text-blue-500'}>
                          {' '}{profitLoss >= 0 ? '+' : ''}{formatNumber(profitLoss)}원
                          ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => openTradeDialog(stock, 'buy')}
                    >
                      매수
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openTradeDialog(stock, 'sell')}
                      disabled={!holding || holding.quantity === 0}
                    >
                      매도
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 거래 다이얼로그 */}
      <Dialog open={tradeDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setTradeDialog({ isOpen: false, stock: null, type: 'buy' })
          setTradeQuantity(1)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tradeDialog.type === 'buy' ? '매수' : '매도'} - {tradeDialog.stock?.name}
            </DialogTitle>
            <DialogDescription>
              현재가: {tradeDialog.stock ? formatNumber(tradeDialog.stock.price) : 0}원
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">수량</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={tradeQuantity}
                onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>총 {tradeDialog.type === 'buy' ? '비용' : '수익'}:</span>
                <span className="font-bold">
                  {tradeDialog.stock ? formatNumber(tradeDialog.stock.price * tradeQuantity) : 0}원
                </span>
              </div>
              {tradeDialog.type === 'buy' && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>잔여 현금:</span>
                  <span>
                    {tradeDialog.stock
                      ? formatNumber(cash - (tradeDialog.stock.price * tradeQuantity))
                      : formatNumber(cash)}원
                  </span>
                </div>
              )}
              {tradeDialog.type === 'sell' && tradeDialog.stock && portfolio[tradeDialog.stock.id] && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>보유 수량:</span>
                  <span>{portfolio[tradeDialog.stock.id].quantity}주</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTradeDialog({ isOpen: false, stock: null, type: 'buy' })
                setTradeQuantity(1)
              }}
            >
              취소
            </Button>
            <Button
              onClick={tradeDialog.type === 'buy' ? handleBuy : handleSell}
            >
              {tradeDialog.type === 'buy' ? '매수' : '매도'} 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

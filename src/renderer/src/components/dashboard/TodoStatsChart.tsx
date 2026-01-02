import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { CheckCircle2 } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { TodoStats } from '../../hooks/useTodoStats'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface TodoStatsChartProps {
  todoStats: TodoStats[]
}

export function TodoStatsChart({ todoStats }: TodoStatsChartProps) {
  const chartData = useMemo(() => ({
    labels: todoStats.map(stat => stat.date),
    datasets: [
      {
        label: '완료한 할 일',
        data: todoStats.map(stat => stat.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  }), [todoStats])

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  }), [])

  return (
    <Card className="lg:col-span-2 border border-border/50 bg-gradient-to-br from-card to-card/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-card-foreground">
              일일 할 일 달성 현황
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">최근 7일간의 완료 기록</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  )
}
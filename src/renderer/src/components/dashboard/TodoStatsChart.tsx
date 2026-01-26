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
        backgroundColor: 'rgba(100, 116, 139, 0.5)',
        borderColor: 'rgba(71, 85, 105, 1)',
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
    <Card className="
      lg:col-span-2 border-0
      rounded-[28px] p-5
      bg-gradient-to-br from-slate-50/80 to-slate-100/50
      dark:from-slate-900/40 dark:to-slate-800/30
      backdrop-blur-2xl border border-slate-200/40 dark:border-slate-700/30
      shadow-lg shadow-slate-500/5 dark:shadow-slate-900/10
      hover:shadow-xl hover:shadow-slate-500/10 dark:hover:shadow-slate-900/20
      transition-all duration-300
    ">
      <CardHeader className="pb-4 p-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
              일일 할 일 달성 현황
            </CardTitle>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-0.5">최근 7일간의 완료 기록</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <div className="h-[240px] p-4 rounded-[20px] bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/40 dark:border-slate-700/30">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  )
}
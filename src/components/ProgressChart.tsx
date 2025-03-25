'use client';

import { useEffect, useRef } from 'react';
import { Chart, ChartType, ChartOptions, registerables } from 'chart.js';
import { Progress } from '@/app/types';

Chart.register(...registerables);

type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    tension?: number;
    fill?: boolean;
  }[];
};

type ProgressChartProps = {
  data: Progress[] | ChartData;
  type?: 'weight' | 'reps' | 'sets';
  chartType?: ChartType;
};

export default function ProgressChart({
  data,
  type = 'weight',
  chartType = 'line',
}: ProgressChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    // Verificar se não há dados ou se o array está vazio
    if (Array.isArray(data) && data.length === 0) return;
    if (!Array.isArray(data) && (!data.labels || data.labels.length === 0)) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destruir gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Preparar dados
    let chartData: ChartData;
    
    if (Array.isArray(data)) {
      // Se for um array de Progress, converter para formato de gráfico
      const sortedData = [...data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      const labels = sortedData.map(item => {
        const date = new Date(item.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });
      
      const values = sortedData.map(item => {
        switch (type) {
          case 'weight':
            return item.weight;
          case 'reps':
            return item.reps;
          case 'sets':
            return item.sets;
          default:
            return item.weight;
        }
      });
      
      chartData = {
        labels,
        datasets: [
          {
            label: type === 'weight' ? 'Peso (kg)' : type === 'reps' ? 'Repetições' : 'Séries',
            data: values,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderWidth: 2,
            tension: 0.2,
          },
        ],
      };
    } else {
      // Se já estiver no formato do Chart.js, usar diretamente
      chartData = data;
    }

    // Configuração do gráfico
    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartData.datasets.length > 1,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            precision: 0,
          },
        },
      },
    };

    // Criar novo gráfico
    chartInstance.current = new Chart(ctx, {
      type: chartType,
      data: chartData,
      options,
    });

    // Limpar ao desmontar
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type, chartType]);

  const hasData = Array.isArray(data) 
    ? data.length > 0 
    : (data.labels && data.labels.length > 0);

  return (
    <div className="w-full h-full">
      {hasData ? (
        <canvas ref={chartRef} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">
          Sem dados para exibir
        </div>
      )}
    </div>
  );
} 
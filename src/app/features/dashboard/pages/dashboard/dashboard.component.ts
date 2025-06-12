import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartOptions } from 'chart.js';
import { TaskService } from 'src/app/services/task.service';
import { DashboardSummary } from 'src/app/models/dtos/dashboard-summary.model';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DashboardUserProgress } from 'src/app/models/dtos/dashboard-summary.model';
Chart.register(ChartDataLabels);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [] as string[],
    datasets: [
      {
        data: [],
        label: 'Progreso (%)',
        backgroundColor: '#42a5f5',
        borderSkipped: false
      }
    ]
  };

barChartOptions: ChartOptions<'bar'> = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: {
        callback: (value) => `${value}%`,
        color: '#aaa'
      },
      max: 100,
      grid: {
        color: '#444'
      }
    },
    y: {
      display: false
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.raw}%`
      }
    },
    datalabels: {
      anchor: 'end',
      align: 'end',
      color: '#fff',
      font: {
        weight: 'bold'
      },
      formatter: (value, ctx) => {
        const user = this.summary?.userProgress?.[ctx.dataIndex];
        return value > 0
          ? (user?.currentTaskTitle ?? '')
          : '';
      }
    }
  }
};




  constructor(
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.taskService.getDashboardSummary().subscribe({
      next: (data) => {
        console.log('Resumen del dashboard:', data);
        this.summary = data;

        const labels: string[] = [];
        const progress: number[] = [];

        for (const user of data.userProgress) {
          labels.push(user.userName);
          const estimated = this.parseTime(user.estimatedTime);
          const actual = this.parseTime(user.actualTimeWorked);
          const percent = estimated > 0 ? Math.min((actual / estimated) * 100, 100) : 0;
          progress.push(+percent.toFixed(1));
        }

        this.barChartData = {
          labels,
          datasets: [
            {
              data: progress,
              label: 'Progreso (%)',
              backgroundColor: '#42a5f5',
              borderSkipped: false
            }
          ]
        };

        this.cdr.detectChanges(); // ✅ Forzar renderizado si usás OnPush
      },
      error: (err) => console.error('Error al cargar el resumen', err)
    });
  }

  parseTime(timeString: string): number {
    const parts = timeString.split(':').map(Number);
    return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
  }

getSingleUserChart(user: DashboardUserProgress): ChartConfiguration<'bar'>['data'] {
  const estimated = this.parseTime(user.estimatedTime);
  const actual = this.parseTime(user.actualTimeWorked);
  const percent = estimated > 0 ? Math.min((actual / estimated) * 100, 100) : 0;

  return {
    labels: [''],
    datasets: [{
      data: [percent],
      label: '',
      backgroundColor: percent > 0 ? '#3b82f6' : 'transparent'
    }]
  };
}

}

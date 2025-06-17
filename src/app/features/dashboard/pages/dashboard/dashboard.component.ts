import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import { TaskService } from 'src/app/services/task.service';
import { DashboardSummary, DashboardUserProgress } from 'src/app/models/dtos/dashboard-summary.model';
import { ProfileService } from 'src/app/pages/profile/services/profile.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  summary: DashboardSummary | null = null;
  allUsers: DashboardUserProgress[] = [];
  private dataRefreshInterval: any;

  doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.raw}`
        }
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: {
          weight: 'bold',
          size: 16
        },
        formatter: (value, ctx) => {
          const data = ctx.chart.data.datasets[0].data;
          const total = Number(data[0]) + Number(data[1] ?? 0);
          const percent = total > 0 ? Math.round((Number(data[0]) / total) * 100) : 0;
          return `${percent}%`;
        }
      }
    }
  };

  constructor(
    private taskService: TaskService,
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();

    // 🔁 Refrescar todo el resumen (tiempo real) cada 5 segundos
    this.dataRefreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.dataRefreshInterval);
  }

  private loadDashboardData(): void {
    this.taskService.getDashboardSummary().subscribe({
      next: (summary) => {
        this.summary = summary;

        this.profileService.getAllUsers().subscribe({
          next: (allProfiles) => {
            this.allUsers = allProfiles.map(profile => {
              const data = summary.userProgress.find(u => u.userId === profile.id);
              return data ?? {
                userId: profile.id,
                userName: profile.userName,
                estimatedTime: '00:00:00',
                actualTimeWorked: '00:00:00',
                currentTaskTitle: undefined,
                taskCount: 0,
                isTimerRunning: false
              };
            });

            this.cdr.detectChanges();
          },
          error: (err) => console.error('Error al cargar perfiles de usuario', err)
        });
      },
      error: (err) => console.error('Error al cargar el resumen del dashboard', err)
    });
  }

  parseTime(timeString: string): number {
    const parts = timeString.split(':').map(Number);
    return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
  }

  formatTime(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  getUserDoughnutData(user: DashboardUserProgress): ChartData<'doughnut'> {
    const estimated = this.parseTime(user.estimatedTime);
    const actual = this.parseTime(user.actualTimeWorked);

    if (estimated === 0 && actual === 0) {
      return {
        labels: ['Sin actividad'],
        datasets: [{
          data: [1],
          backgroundColor: ['#777'],
          hoverBackgroundColor: ['#888'],
          borderWidth: 0
        }]
      };
    }

    const worked = Math.min(actual, estimated);
    const remaining = Math.max(estimated - worked, 0);

    return {
      labels: ['Trabajado', 'Restante'],
      datasets: [{
        data: [worked, remaining],
        backgroundColor: ['#3b82f6', '#e5e7eb'],
        hoverBackgroundColor: ['#2563eb', '#d1d5db'],
        borderWidth: 0
      }]
    };
  }
}

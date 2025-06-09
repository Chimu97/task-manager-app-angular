import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { TaskService } from 'src/app/services/task.service';
import { DashboardSummary } from 'src/app/models/dtos/dashboard-summary.model';

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
      }
    ]
  };

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.taskService.getDashboardSummary().subscribe({
      next: (data) => {
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
              backgroundColor: '#42a5f5'
            }
          ]
        };
      },
      error: (err) => console.error('Error al cargar el resumen', err)
    });
  }

  parseTime(timeString: string): number {
    const parts = timeString.split(':').map(Number);
    return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
  }
}

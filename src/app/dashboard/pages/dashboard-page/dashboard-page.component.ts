import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from 'src/app/services/task.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit {
  dashboardSummary: any;

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.taskService.getDashboardSummary().subscribe({
      next: (data) => this.dashboardSummary = data,
      error: (err) => console.error('Error cargando dashboard summary', err)
    });
  }
}

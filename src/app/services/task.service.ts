import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { KanbanTaskItem } from 'src/app/models/entities/kanban-task-item';
import { map } from 'rxjs/operators';
import { DashboardSummary } from 'src/app/models/dtos/dashboard-summary.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:5108/api/tasks';

  constructor(private http: HttpClient) { }

  getTasks(): Observable<KanbanTaskItem[]> {
    return this.http.get<any[]>(`${this.apiUrl}/kanban`).pipe(
      map((tasks: any[]) =>
        tasks.map(task => ({
          ...task,
          assignedTo: task.assignedUser?.userName || ''
        }))
      )
    );
  }

  updateTask(task: KanbanTaskItem): Observable<KanbanTaskItem> {
    return this.http.put<KanbanTaskItem>(`${this.apiUrl}/${task.id}`, task);
  }

  createTask(task: KanbanTaskItem): Observable<KanbanTaskItem> {
    return this.http.post<KanbanTaskItem>(this.apiUrl, task);
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  toggleTimer(taskId: number): Observable<KanbanTaskItem> {
    return this.http.patch<KanbanTaskItem>(`${this.apiUrl}/${taskId}/toggle-timer`, {});
  }

  getSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/summary`);
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>('/api/tasks/dashboard-summary');
  }

  getCompletedTasks(): Observable<KanbanTaskItem[]> {
    return this.http.get<KanbanTaskItem[]>(`${this.apiUrl}/completed`);
  }
}
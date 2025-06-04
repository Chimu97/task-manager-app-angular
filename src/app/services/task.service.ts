import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { KanbanTaskItem } from 'src/app/models/entities/kanban-task-item';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:5108/api/tasks'; // Cambiado al nuevo backend

  constructor(private http: HttpClient) { }

  getTasks(): Observable<KanbanTaskItem[]> {
    return this.http.get<KanbanTaskItem[]>(`${this.apiUrl}/kanban`);
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
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TaskItem {
  id?: number;
  title: string;
  status: string;
  time?: number;
  rating?: number;
  comment?: string;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'https://localhost:5001/api/taskitems'; // ⚠️ ajustá si usás otro puerto/backend

  constructor(private http: HttpClient) {}

getTasks(): Observable<TaskItem[]> {
  return this.http.get<TaskItem[]>('https://localhost:5001/api/taskitems/odata');
}


  createTask(task: TaskItem): Observable<any> {
    return this.http.post(this.apiUrl, task);
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

import { Component, OnInit } from '@angular/core';
import { KanbanTaskItem } from 'src/app/models/entities/kanban-task-item';
import { TaskService } from 'src/app/services/task.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-completed-tasks',
  templateUrl: './completed-tasks.component.html',
  styleUrls: ['./completed-tasks.component.scss']
})
export class CompletedTasksComponent implements OnInit {
  tasks: KanbanTaskItem[] = [];
  loading = true;

  constructor(private taskService: TaskService,
    private cdr: ChangeDetectorRef
  ) { }

  fromDate: string = '';
  toDate: string = '';
  originalTasks: KanbanTaskItem[] = [];
  selectedUser: string = 'all';
  userList: string[] = [];

  ngOnInit(): void {
    this.taskService.getCompletedTasks().subscribe({
      next: (tasks) => {
        // Parsear fechas y ordenar
        const parsedTasks = tasks.map(t => ({
          ...t,
          finishedAt: t.finishedAt ? new Date(t.finishedAt) : null
        }));

        this.tasks = [...parsedTasks].sort((a, b) => {
          if (!a.finishedAt || !b.finishedAt) return 0;
          return b.finishedAt.getTime() - a.finishedAt.getTime();
        });

        this.originalTasks = [...this.tasks];

        // Extraer usuarios únicos (filtrar null/undefined)
        this.userList = Array.from(
          new Set(
            this.tasks
              .map(t => t.assignedUser?.userName)
              .filter((name): name is string => !!name)
          )
        ).sort();

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener tareas completadas', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

filtrarPorFechas(): void {
  const from = this.fromDate ? new Date(this.fromDate) : null;
  const to = this.toDate ? new Date(this.toDate) : null;

  this.tasks = this.originalTasks.filter(task => {
    const inDateRange =
      (!from || (task.finishedAt && task.finishedAt >= from)) &&
      (!to || (task.finishedAt && task.finishedAt <= to));

    const byUser =
      this.selectedUser === 'all' ||
      task.assignedUser?.userName === this.selectedUser;

    return inDateRange && byUser;
  });
}

resetFiltro(): void {
  this.tasks = [...this.originalTasks];
  this.fromDate = '';
  this.toDate = '';
  this.selectedUser = 'all';
}

}


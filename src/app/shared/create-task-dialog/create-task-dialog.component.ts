import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { AuthService } from 'src/app/services/auth.service';
import { KanbanTaskItem } from 'src/app/models/entities/kanban-task-item';
import { TaskService } from 'src/app/services/task.service';


export interface CreateTaskDialogData {
  userId: number;
  roles: string[];
  availableUsers: { id: number; userName: string }[];
}

@Component({
  selector: 'app-create-task-dialog',
  templateUrl: './create-task-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
  ],
})
export class CreateTaskDialogComponent {
  title = '';
  description = '';
  estimatedTime: string = '00:00:00';
  assignedUserId: number;

  constructor(
    public dialogRef: MatDialogRef<CreateTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateTaskDialogData,
    private authService: AuthService,
    private taskService: TaskService
  ) {
    this.assignedUserId = data.userId;
  }

  isAdminOrSupervisor(): boolean {
    const roles = this.authService.currentUserRoles;
    return roles.includes('Admin') || roles.includes('Supervisor');
  }

  createTask(): void {
    const task: KanbanTaskItem = {
      title: this.title,
      description: this.description,
      status: 'ToDo',
      estimatedTime: this.estimatedTime,
      actualTimeWorked: '00:00:00',
      isTimerRunning: false,
      assignedUserId: this.isAdminOrSupervisor()
        ? Number(this.assignedUserId)
        : Number(this.authService.currentUserId),
    };
    this.taskService.createTask(task).subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => console.error('Error al crear tarea:', error),
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}

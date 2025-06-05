import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';


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
    CommonModule, // ← necesario para *ngIf, *ngFor
    FormsModule,  // ← necesario para ngModel
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
    @Inject(MAT_DIALOG_DATA) public data: CreateTaskDialogData
  ) {
    this.assignedUserId = data.userId; // default = self
  }

  isAdminOrSupervisor(): boolean {
    return this.data.roles.includes('Admin') || this.data.roles.includes('Supervisor');
  }

  createTask(): void {
    if (!this.title.trim()) return;

    this.dialogRef.close({
      title: this.title,
      description: this.description,
      assignedUserId: this.assignedUserId,
      estimatedTime: this.estimatedTime
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}

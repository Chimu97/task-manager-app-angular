import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { KanbanTaskItem } from 'src/app/models/entities/kanban-task-item';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-task-dialog',
  standalone: true,
  template: `
    <h2 mat-dialog-title>Editar tarea</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Título</mat-label>
        <input matInput [(ngModel)]="data.title" #titleInput="ngModel" required />
        <mat-error *ngIf="titleInput.invalid && titleInput.touched">
          El título es obligatorio.
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Descripción</mat-label>
        <textarea matInput rows="4" [(ngModel)]="data.description"></textarea>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button color="warn" (click)="delete()">Eliminar</button>
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-button color="primary" (click)="save()" [disabled]="!data.title.trim()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ]
})
export class EditTaskDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EditTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: KanbanTaskItem
  ) {}

  save(): void {
    this.dialogRef.close(this.data);
  }

  delete(): void {
    this.dialogRef.close({ delete: true, id: this.data.id });
  }
}
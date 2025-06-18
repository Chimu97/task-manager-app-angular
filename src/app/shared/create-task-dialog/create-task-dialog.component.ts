import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  ReactiveFormsModule,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

export interface CreateTaskDialogData {
  userId: number;
  roles: string[];
  availableUsers: { id: number; userName: string }[];
}

@Component({
  selector: 'app-create-task-dialog',
  templateUrl: './create-task-dialog.component.html',
  styleUrls: ['./create-task-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    NgxMaskDirective,
  ],
  providers: [provideNgxMask()],
})
export class CreateTaskDialogComponent {
  form: FormGroup;

  hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  minutes: number[] = Array.from({ length: 60 }, (_, i) => i);
  seconds: number[] = Array.from({ length: 60 }, (_, i) => i);

  constructor(
    public dialogRef: MatDialogRef<CreateTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateTaskDialogData,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group(
      {
        title: ['', Validators.required],
        description: [''],
        hours: [0, Validators.required],
        minutes: [0, Validators.required],
        seconds: [0, Validators.required],
        assignedUserId: [
          data.userId,
          this.isAdminOrSupervisor() ? Validators.required : [],
        ],
      },
      {
        validators: [this.validateNonZeroTime()],
      }
    );
  }

  isAdminOrSupervisor(): boolean {
    const roles = this.authService.currentUserRoles;
    return roles.includes('Admin') || roles.includes('Supervisor');
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  createTask(): void {
    if (this.form.invalid) return;

    const { title, description, hours, minutes, seconds } = this.form.value;

    const estimatedTime = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');

    const task = {
      title,
      description,
      estimatedTime,
      assignedUserId: this.isAdminOrSupervisor()
        ? Number(this.form.value.assignedUserId)
        : Number(this.authService.currentUserId),
    };

    this.dialogRef.close(task);
  }

  private validateNonZeroTime(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const h = group.get('hours')?.value;
      const m = group.get('minutes')?.value;
      const s = group.get('seconds')?.value;

      return h === 0 && m === 0 && s === 0 ? { zeroTime: true } : null;
    };
  }
}

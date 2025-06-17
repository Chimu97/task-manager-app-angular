import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskService } from 'src/app/services/task.service';
import { KanbanTaskItem } from 'src/app/models/entities/kanban-task-item';
import { ChangeDetectorRef } from '@angular/core';
import { EditTaskDialogComponent } from 'src/app/shared/edit-task-dialog.component';
import { CreateTaskDialogComponent } from 'src/app/shared/create-task-dialog/create-task-dialog.component';
import { TokenService } from 'src/app/services/token.service';
import { ProfileService } from 'src/app/pages/profile/services/profile.service';

type Column = {
  title: string;
  status: KanbanTaskItem['status'];
  tasks: KanbanTaskItem[];
};

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanBoardComponent implements OnInit {
  columns: Column[] = [
    { title: 'To Do', status: 'ToDo', tasks: [] },
    { title: 'In Progress', status: 'InProgress', tasks: [] },
    { title: 'Paused', status: 'Paused', tasks: [] },
    { title: 'Testing', status: 'Testing', tasks: [] },
    { title: 'Done', status: 'Done', tasks: [] }
  ];

  connectedDropLists: string[] = [];
  showGlobalTaskInput = false;
  globalNewTaskTitle = '';
  private taskTimers: { [taskId: number]: any } = {};

  @ViewChild('taskInput') taskInputRef!: ElementRef;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private tokenService: TokenService,
    private profileService: ProfileService
  ) { }

  ngOnInit(): void {

    this.taskService.getTasks().subscribe((tasks: KanbanTaskItem[]) => {

      // Reasignar columnas correctamente
      this.columns = this.columns.map(column => ({
        ...column,
        tasks: tasks.filter(task => task.status === column.status)
      }));

      this.connectedDropLists = this.columns.map((_, index) => `column-${index}`);

      // Esperar a que las columnas estén correctamente asignadas
      setTimeout(() => {
        for (const task of tasks) {
          if (task.status === 'InProgress' && task.isTimerRunning) {
            this.startVisualTimer(task);
          }
        }
      }, 500); // breve delay para asegurar sincronización visual

      this.cdr.detectChanges();
    });
  }

  drop(event: CdkDragDrop<KanbanTaskItem[]>, newStatus: KanbanTaskItem['status']) {
    const task = event.previousContainer.data[event.previousIndex];

    // 🚫 Validación de transición no permitida
    if (!this.isValidTransition(task.status, newStatus)) {
      this.snackBar.open('Transición de estado no permitida', 'Cerrar', { duration: 3000 });
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const previousStatus = task.status;
      task.status = newStatus;
      task.updatedAt = new Date();

      // ⏸ Pausar si pasa a "Paused"
      if (newStatus === 'Paused' && task.isTimerRunning) {
        this.taskService.toggleTimer(task.id!).subscribe({
          next: (updatedTask) => {
            Object.assign(task, updatedTask);
            task.status = newStatus;
            this.stopVisualTimer(task.id!);
            this.taskService.updateTask(task).subscribe({
              next: () => {
                this.snackBar.open('Tarea actualizada', 'Cerrar', { duration: 2000 });
                this.cdr.detectChanges();
              },
              error: () => {
                this.snackBar.open('Error al actualizar tarea', 'Cerrar', { duration: 3000 });
              }
            });
          },
          error: () => {
            this.snackBar.open('Error al pausar temporizador', 'Cerrar', { duration: 3000 });
          }
        });
      }

      // ▶ Reanudar si pasa a "InProgress"
      else if (newStatus === 'InProgress' && !task.isTimerRunning) {
        this.taskService.toggleTimer(task.id!).subscribe({
          next: (updatedTask) => {
            Object.assign(task, updatedTask);
            task.status = newStatus;
            this.startVisualTimer(task);
            this.taskService.updateTask(task).subscribe({
              next: () => {
                this.snackBar.open('Tarea actualizada', 'Cerrar', { duration: 2000 });
                this.cdr.detectChanges();
              },
              error: () => {
                this.snackBar.open('Error al actualizar tarea', 'Cerrar', { duration: 3000 });
              }
            });
          },
          error: () => {
            this.snackBar.open('Error al iniciar temporizador', 'Cerrar', { duration: 3000 });
          }
        });
      }

      // ⏹ Detener si pasa a "Done"
      else if (newStatus === 'Done' && task.isTimerRunning) {
        this.taskService.toggleTimer(task.id!).subscribe({
          next: (updatedTask) => {
            Object.assign(task, updatedTask);
            task.status = newStatus;
            this.stopVisualTimer(task.id!);
            this.taskService.updateTask(task).subscribe({
              next: () => {
                this.snackBar.open('Tarea actualizada', 'Cerrar', { duration: 2000 });
                this.cdr.detectChanges();
              },
              error: () => {
                this.snackBar.open('Error al actualizar tarea', 'Cerrar', { duration: 3000 });
              }
            });
          },
          error: () => {
            this.snackBar.open('Error al detener temporizador', 'Cerrar', { duration: 3000 });
          }
        });
      }

      // Otros cambios sin impacto en el temporizador
      else {
        this.taskService.updateTask(task).subscribe({
          next: () => {
            this.snackBar.open('Tarea actualizada', 'Cerrar', { duration: 2000 });
            this.cdr.detectChanges();
          },
          error: () => {
            this.snackBar.open('Error al actualizar tarea', 'Cerrar', { duration: 3000 });
          }
        });
      }
    }
  }

  private isValidTransition(from: KanbanTaskItem['status'], to: KanbanTaskItem['status']): boolean {
    const rules: Record<string, string[]> = {
      ToDo: ['InProgress'],
      InProgress: ['Paused', 'Testing'],
      Paused: ['InProgress'],
      Testing: ['InProgress', 'Done'],
      Done: [] // No se puede mover desde Done
    };

    return rules[from]?.includes(to);
  }



  onToggleTimer(task: KanbanTaskItem, event: MouseEvent): void {
    event.stopPropagation();

    this.taskService.toggleTimer(task.id!).subscribe({
      next: (updatedTask) => {
        Object.assign(task, updatedTask);

        if (task.isTimerRunning) {
          this.startVisualTimer(task);
        } else {
          this.stopVisualTimer(task.id!);
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Error al cambiar estado del temporizador', 'Cerrar', {
          duration: 3000,
        });
      }
    });
  }

  startVisualTimer(task: KanbanTaskItem): void {
    const taskId = task.id!;
    let seconds = this.parseTimeToSeconds(task.actualTimeWorked);

    // Limpiar timer previo si existe
    if (this.taskTimers[taskId]) {
      clearInterval(this.taskTimers[taskId]);
    }

    this.taskTimers[taskId] = setInterval(() => {
      seconds += 1;
      const formatted = this.formatSecondsToHHMMSS(seconds);

      for (const column of this.columns) {
        const currentTask = column.tasks.find(t => t.id === taskId);
        if (currentTask) {
          currentTask.actualTimeWorked = formatted;
        }
      }


      this.cdr.markForCheck();
    }, 1000);
  }

  stopVisualTimer(taskId: number): void {
    if (this.taskTimers[taskId]) {
      clearInterval(this.taskTimers[taskId]);
      delete this.taskTimers[taskId];
    }
  }

  parseTimeToSeconds(timeStr: string): number {
    const clean = timeStr.split('.')[0]; // elimina milisegundos si existen
    const [hh = '0', mm = '0', ss = '0'] = clean.split(':');
    return (+hh) * 3600 + (+mm) * 60 + (+ss);
  }



  formatSecondsToHHMMSS(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }
  pad(num: number): string {
    return num.toString().padStart(2, '0');
  }

  openCreateTaskDialog(): void {
    const userId = this.tokenService.getUserId();
    const roles = this.tokenService.getRoles();

    this.profileService.getAllUsers().subscribe((users: { id: number; userName: string }[]) => {
      const dialogRef = this.dialog.open(CreateTaskDialogComponent, {
        data: {
          userId,
          roles,
          availableUsers: users
        }
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (!result) return;

        const newTask: KanbanTaskItem = {
          title: result.title,
          description: result.description,
          assignedTo: result.assignedTo,
          assignedUserId: result.assignedUserId,
          estimatedTime: result.estimatedTime,
          actualTimeWorked: '00:00:00',
          isTimerRunning: false,
          status: 'ToDo'
        };

        this.taskService.createTask({
          ...newTask,
          assignedUserId: result.assignedUserId,
        }).subscribe((createdTask) => {
          const updatedColumn = this.columns.find(col => col.status === createdTask.status);
          if (updatedColumn) {
            updatedColumn.tasks.push(createdTask);
            this.cdr.detectChanges();
          }

          this.snackBar.open('Tarea creada correctamente', 'Cerrar', { duration: 3000 });
        });
      });
    });
  }

  editTask(columnIndex: number, taskIndex: number): void {
    const task = this.columns[columnIndex].tasks[taskIndex];

    const dialogRef = this.dialog.open(EditTaskDialogComponent, {
      data: { ...task }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      if (result.delete && task.id) {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
          data: {
            title: '¿Eliminar tarea?',
            message: 'Esta acción no se puede deshacer.'
          }
        });

        confirmRef.afterClosed().subscribe((confirmed) => {
          if (!confirmed) return;

          this.taskService.deleteTask(task.id!).subscribe({
            next: () => {
              const updatedColumn = {
                ...this.columns[columnIndex],
                tasks: this.columns[columnIndex].tasks.filter(t => t.id !== task.id)
              };

              this.columns = this.columns.map((col, idx) =>
                idx === columnIndex ? updatedColumn : col
              );

              this.snackBar.open('Tarea eliminada correctamente', 'Cerrar', { duration: 3000 });
              this.cdr.detectChanges();
            },
            error: () => {
              this.snackBar.open('Error al eliminar la tarea', 'Cerrar', { duration: 3000 });
            }
          });
        });
      } else if (result.title && task.id) {
        const updatedTask: KanbanTaskItem = {
          ...task,
          title: result.title.trim(),
          description: result.description?.trim() || ''
        };

        this.taskService.updateTask(updatedTask).subscribe({
          next: (updated) => {
            this.columns[columnIndex].tasks[taskIndex] = updated;
            this.snackBar.open('Tarea actualizada correctamente', 'Cerrar', { duration: 3000 });
            this.cdr.detectChanges();
          },
          error: () => {
            this.snackBar.open('Error al actualizar la tarea', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  public isAdminOrSupervisor(): boolean {
    const roles = this.tokenService.getRoles();
    return roles.includes('Admin') || roles.includes('Supervisor');
  }

  getTextColor(hslColor?: string): string {
    if (!hslColor || !hslColor.startsWith('hsl')) return 'white';

    // Extraer valores numéricos de hsl(x, y%, l%)
    const match = hslColor.match(/hsl\(\s*(\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
    if (!match) return 'white';

    const lightness = parseInt(match[3], 10); // tercer valor = L (luminosidad)

    // Si la luminosidad es mayor a 60%, usamos texto oscuro
    return lightness > 60 ? 'black' : 'white';
  }

}
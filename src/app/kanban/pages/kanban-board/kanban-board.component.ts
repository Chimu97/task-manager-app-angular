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
    console.log('KANBAN INIT');
    this.connectedDropLists = this.columns.map((_, index) => `column-${index}`);
    this.taskService.getTasks().subscribe((tasks: KanbanTaskItem[]) => {
      console.log('TAREAS:', tasks);

      this.columns = this.columns.map(column => ({
        ...column,
        tasks: tasks.filter(task => task.status === column.status)
      }));

      tasks.forEach(task => {
        if (task.status === 'InProgress' && task.isTimerRunning) {
          console.log('▶️ TAREA PARA TIMER:', {
            id: task.id,
            title: task.title,
            actualTimeWorked: task.actualTimeWorked,
            timerStartedAt: task.timerStartedAt
          });
          this.startVisualTimer(task);
        }
      });


      this.cdr.detectChanges();
    });
  }

  drop(event: CdkDragDrop<KanbanTaskItem[]>, newStatus: KanbanTaskItem['status']) {
    const task = event.previousContainer.data[event.previousIndex];

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

      task.status = newStatus;
      task.updatedAt = new Date();

      this.taskService.updateTask(task).subscribe({
        next: () => {
          this.snackBar.open('Tarea actualizada', 'Cerrar', { duration: 2000 });

          if (newStatus === 'InProgress' && !task.isTimerRunning) {
            this.taskService.toggleTimer(task.id!).subscribe({
              next: (updatedTask) => {
                Object.assign(task, updatedTask);
                this.startVisualTimer(task);
                this.cdr.detectChanges();
              },
              error: () => {
                this.snackBar.open('Error al iniciar temporizador', 'Cerrar', { duration: 3000 });
              }
            });
          }
        },
        error: () => {
          this.snackBar.open('Error al actualizar tarea', 'Cerrar', { duration: 3000 });
        }
      });
    }
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
    if (this.taskTimers[task.id!]) return;

    const initialWorkedSeconds = this.parseTimeToSeconds(task.actualTimeWorked);
    const startedAtTimestamp = task.timerStartedAt
      ? Date.parse(task.timerStartedAt + '') // fuerza interpretación como UTC string
      : Date.now();

      console.log('⏱ Initial seconds:', initialWorkedSeconds);
console.log('⏱ StartedAt:', startedAtTimestamp);

this.taskTimers[task.id!] = setInterval(() => {
  const now = Date.now();
  let elapsed = Math.floor((now - startedAtTimestamp) / 1000);
  if (elapsed < 0) elapsed = 0;

  const totalSeconds = initialWorkedSeconds + elapsed;
  task.actualTimeWorked = this.formatSecondsToHHMMSS(totalSeconds);

  // 🔥 Forzar actualización del array (clave)
  this.columns = [...this.columns];

  // Para seguridad adicional si tenés OnPush
  this.cdr.detectChanges();
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

}
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskService } from 'src/app/services/task.service';
import { KanbanTaskItem } from 'src/app/models/entities/kanban-task-item';
import { ChangeDetectorRef } from '@angular/core';
import { EditTaskDialogComponent } from 'src/app/shared/edit-task-dialog.component';


type Column = {
  title: string;
  status: KanbanTaskItem['status'];
  tasks: KanbanTaskItem[];
};

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss']
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

  @ViewChild('taskInput') taskInputRef!: ElementRef;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    console.log('KANBAN INIT');
    this.connectedDropLists = this.columns.map((_, index) => `column-${index}`);

    this.taskService.getTasks().subscribe((tasks: KanbanTaskItem[]) => {
      console.log('TAREAS:', tasks); // Verifica que esto aparece

      this.columns = this.columns.map(column => ({
        ...column,
        tasks: tasks.filter(task => task.status === column.status)
      }));

      this.cdr.detectChanges();
      console.log('COLUMNAS:', this.columns); // Verifica que las columnas se llenan correctamente
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

      // Actualizar y persistir
      task.status = newStatus;
      task.updatedAt = new Date();

      this.taskService.updateTask(task).subscribe({
        next: () => {
          this.snackBar.open('Tarea actualizada', 'Cerrar', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Error al actualizar tarea', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }




  openTaskInput() {
    this.showGlobalTaskInput = true;
    setTimeout(() => {
      this.taskInputRef?.nativeElement.focus();
    }, 0);
  }

  addGlobalTask() {
    const title = this.globalNewTaskTitle.trim();

    if (title) {
      const newTask: KanbanTaskItem = {
        title,
        status: 'ToDo',
        assignedTo: 'gp', // Puedes asignar un usuario si es necesario
      };

      this.taskService.createTask(newTask).subscribe({
        next: (createdTask) => {
          const updatedColumn = {
            ...this.columns[0],
            tasks: [...this.columns[0].tasks, createdTask]
          };

          this.columns = this.columns.map((col, idx) =>
            idx === 0 ? updatedColumn : col
          );

          this.cdr.detectChanges(); // ✅ Esto hace visible la nueva tarjeta inmediatamente

          this.snackBar.open('Tarea creada correctamente', 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Error al crear la tarea', 'Cerrar', { duration: 3000 });
        }
      });

      this.globalNewTaskTitle = '';
      this.showGlobalTaskInput = false;
    }
  }

  cancelGlobalTask() {
    this.globalNewTaskTitle = '';
    this.showGlobalTaskInput = false;
  }

  deleteTask(columnIndex: number, taskIndex: number) {
    const task = this.columns[columnIndex].tasks[taskIndex];

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: `¿Estás seguro de que deseas eliminar la tarea "${task.title}"?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && task.id) {
        this.taskService.deleteTask(task.id).subscribe({
          next: () => {
            const updatedColumn = {
              ...this.columns[columnIndex],
              tasks: this.columns[columnIndex].tasks.filter(t => t.id !== task.id)
            };

            this.columns = this.columns.map((col, idx) =>
              idx === columnIndex ? updatedColumn : col
            );

            this.cdr.detectChanges(); // ✅ Forzar actualización visual

            this.snackBar.open('Tarea eliminada correctamente', 'Cerrar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Error al eliminar la tarea', 'Cerrar', { duration: 3000 });
          }
        });
      }
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
        // 🧨 Eliminación desde el modal
        this.taskService.deleteTask(task.id).subscribe({
          next: () => {
            const updatedColumn = {
              ...this.columns[columnIndex],
              tasks: this.columns[columnIndex].tasks.filter(t => t.id !== task.id)
            };

            this.columns = this.columns.map((col, idx) =>
              idx === columnIndex ? updatedColumn : col
            );

            this.snackBar.open('Tarea eliminada correctamente', 'Cerrar', { duration: 3000 });
            this.cdr.detectChanges(); // 👈 Forzar re-render inmediato
          },
          error: () => {
            this.snackBar.open('Error al eliminar la tarea', 'Cerrar', { duration: 3000 });
          }
        });
      } else if (result.title && task.id) {
        // ✏️ Edición desde el modal
        const updatedTask: KanbanTaskItem = {
          ...task,
          title: result.title.trim(),
          description: result.description?.trim() || ''
        };

        this.taskService.updateTask(updatedTask).subscribe({
          next: (updated) => {
            this.columns[columnIndex].tasks[taskIndex] = updated;
            this.snackBar.open('Tarea actualizada correctamente', 'Cerrar', { duration: 3000 });
            this.cdr.detectChanges(); // 👈 Garantizar que se refleje
          },
          error: () => {
            this.snackBar.open('Error al actualizar la tarea', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });

    interface Task{
      title: string;
      id: string;
      assignedTo?: string;
    }
  }
}
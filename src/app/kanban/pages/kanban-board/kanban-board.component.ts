import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskService, TaskItem } from 'src/app/services/task.service';

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss']
})
export class KanbanBoardComponent implements OnInit {
columns = [
  { title: 'To Do', status: 'To Do', tasks: [] as TaskItem[] },
  { title: 'In Progress', status: 'In Progress', tasks: [] as TaskItem[] },
  { title: 'Testing', status: 'Testing', tasks: [] as TaskItem[] },
  { title: 'Done', status: 'Done', tasks: [] as TaskItem[] }
];


  connectedDropLists: string[] = [];

  showGlobalTaskInput = false;
  globalNewTaskTitle = '';

  @ViewChild('taskInput') taskInputRef!: ElementRef;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private taskService: TaskService
  ) { }

ngOnInit(): void {
  this.connectedDropLists = this.columns.map((_, index) => `column-${index}`);

  this.taskService.getTasks().subscribe((tasks: TaskItem[]) => {
    this.columns.forEach(column => {
      column.tasks = tasks.filter(task => task.status === column.status);
    });
  });
}


  drop(event: CdkDragDrop<any[]>) {
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
    const newTask = { title, status: 'To Do' };

    this.taskService.createTask(newTask).subscribe({
      next: (createdTask) => {
        this.columns[0].tasks.push(createdTask); // en caso de que el backend retorne con ID u otros datos
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
          this.columns[columnIndex].tasks = this.columns[columnIndex].tasks.filter(t => t.id !== task.id);
          this.snackBar.open('Tarea eliminada correctamente', 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Error al eliminar la tarea', 'Cerrar', { duration: 3000 });
        }
      });
    }
  });
}





}

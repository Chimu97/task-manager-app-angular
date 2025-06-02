import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss']
})
export class KanbanBoardComponent implements OnInit {
  columns = [
    {
      title: 'To Do',
      tasks: [
        { title: 'Configurar backend' },
        { title: 'Crear login' }
      ]
    },
    {
      title: 'In Progress',
      tasks: [
        { title: 'Diseño del dashboard' }
      ]
    },
    {
      title: 'Testing',
      tasks: [
        { title: 'Revisar flujo de autenticación' }
      ]
    },
    {
      title: 'Done',
      tasks: [
        { title: 'Setup inicial del proyecto' }
      ]
    }
  ];

  connectedDropLists: string[] = [];

  showGlobalTaskInput = false;
  globalNewTaskTitle = '';

  @ViewChild('taskInput') taskInputRef!: ElementRef;

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    this.connectedDropLists = this.columns.map((_, index) => `column-${index}`);
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
      this.columns[0].tasks.push({ title });
      this.globalNewTaskTitle = '';
      this.showGlobalTaskInput = false;
    }
  }

  cancelGlobalTask() {
    this.globalNewTaskTitle = '';
    this.showGlobalTaskInput = false;
  }

  deleteTask(columnIndex: number, taskIndex: number) {
    const taskTitle = this.columns[columnIndex].tasks[taskIndex].title;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: `¿Estás seguro de que deseas eliminar la tarea "${taskTitle}"?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.columns[columnIndex].tasks.splice(taskIndex, 1);
      }
    });
  }


}

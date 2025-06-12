import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { CompletedTasksComponent } from './pages/completed-tasks/completed-tasks.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [CompletedTasksComponent],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    FormsModule
  ]
})
export class ReportsModule {}
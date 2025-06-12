import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompletedTasksComponent } from './pages/completed-tasks/completed-tasks.component';

const routes: Routes = [
  {
    path: 'completed-tasks',
    component: CompletedTasksComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule {}

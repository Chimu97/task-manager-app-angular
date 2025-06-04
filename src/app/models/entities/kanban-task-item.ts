export type TaskStatus = 'ToDo' | 'InProgress' | 'Testing' | 'Done';

export interface KanbanTaskItem {
  id?: number;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt?: Date;
  updatedAt?: Date;
  assignedTo?: string; // Optional field for user assignment
  priority?: 'Low' | 'Medium' | 'High'; // Optional field for task priority
}

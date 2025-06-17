export type TaskStatus = 'ToDo' | 'InProgress' | 'Paused'| 'Testing' | 'Done';

export interface KanbanTaskItem {
  id?: number;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt?: Date;
  updatedAt?: Date;

  assignedTo?: string;
  assignedUserId?: number;
  assignedUser?: {
    id: number;
    userName: string;
    colorHex?: string;
  };

  estimatedTime: string;
  actualTimeWorked: string;
  isTimerRunning: boolean;
  timerStartedAt?: string | null;
  finishedAt?: Date | null; 
}

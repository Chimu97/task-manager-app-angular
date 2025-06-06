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
  };

  estimatedTime: string;        // ej. "01:30:00"
  actualTimeWorked: string;     // ej. "00:12:34"
  isTimerRunning: boolean;
  timerStartedAt?: string | null;
}

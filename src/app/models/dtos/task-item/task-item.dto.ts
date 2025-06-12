export interface TaskItemDto {
  id: number;
  title: string;
  description: string;
  status: string;
  assignedUserId: number | null;
  assignedUser?: {
    id: number;
    userName: string;
  } | null;
  estimatedTime: string;
  actualTimeWorked: string;
  isTimerRunning: boolean;
  timerStartedAt?: string;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
}

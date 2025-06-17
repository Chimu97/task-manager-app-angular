export interface DashboardUserProgress {
  userId: number;
  userName: string;
  taskCount: number;
  estimatedTime: string;
  actualTimeWorked: string;
  currentTaskTitle?: string;
  isTimerRunning: boolean; 
}

export interface DashboardSummary {
  totalTasks: number;
  totalEstimatedTime: string;
  totalActualTimeWorked: string;
  overdueTaskCount: number;
  userProgress: DashboardUserProgress[];
}

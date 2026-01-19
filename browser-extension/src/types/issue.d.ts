export interface IssueData {
  id: string;
  redmineId: string;
  title: string;
  tracker: string;
  status: string;
  priority: string;
  assignee: string;
  description: string;
  startDate: string;
  estimatedHours: string;
  component: string;
  author: string;
}

export interface ReportFormData {
  redmineId: string;
  title: string;

  files: string;
  modifier: string;
  modifyDate: string;
  reason: string;
  solution: string;
  affectedModules: string;
  debuggingResults:DebuggingResults;
}


export interface DebuggingResults{
  initialState: string;
  resultState: string;
}
/** Domínio interno (camelCase) após importar BackupFileV1 ou array legado. */
export type SmartTaskNormalizedSubtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type SmartTaskNormalizedTask = {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: 1 | 2 | 3 | 4;
  tags: string[];
  subtasks: SmartTaskNormalizedSubtask[];
  status: "active" | "completed" | "archived";
  focusOfDay: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

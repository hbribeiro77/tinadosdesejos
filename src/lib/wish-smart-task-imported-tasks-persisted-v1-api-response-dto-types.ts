import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";

export type WishSmartTaskImportedTasksPersistedV1GetOkFoundDto = {
  ok: true;
  found: true;
  tasks: SmartTaskNormalizedTask[];
  updatedAt: string;
};

export type WishSmartTaskImportedTasksPersistedV1GetOkEmptyDto = {
  ok: true;
  found: false;
};

export type WishSmartTaskImportedTasksPersistedV1GetResponseDto =
  | WishSmartTaskImportedTasksPersistedV1GetOkFoundDto
  | WishSmartTaskImportedTasksPersistedV1GetOkEmptyDto
  | { ok: false; message: string };

export type WishSmartTaskImportedTasksPersistedV1PutOkDto = {
  ok: true;
  updatedAt: string;
};

export type WishSmartTaskImportedTasksPersistedV1PutResponseDto =
  | WishSmartTaskImportedTasksPersistedV1PutOkDto
  | { ok: false; code?: string; message: string };

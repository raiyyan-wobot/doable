// UI state for the two dialogs: the task editor and the confirm prompt.
import { createSignal } from "solid-js";
import type { Task } from "../api/types";

export interface EditorState {
  open: boolean;
  /** The task being edited, or null when creating a new one. */
  task: Task | null;
}

export interface ConfirmRequest {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export function createDialogs() {
  const [editor, setEditor] = createSignal<EditorState>({ open: false, task: null });
  const [confirmRequest, setConfirmRequest] = createSignal<ConfirmRequest | null>(null);

  return {
    editor,
    openNew: () => setEditor({ open: true, task: null }),
    openEdit: (task: Task) => setEditor({ open: true, task }),
    closeEditor: () => setEditor((prev) => ({ ...prev, open: false })),

    confirmRequest,
    requestConfirm: (request: ConfirmRequest) => setConfirmRequest(request),
    dismissConfirm: () => setConfirmRequest(null),
  };
}

export type DialogsState = ReturnType<typeof createDialogs>;

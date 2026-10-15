import { Button } from "~/components/ui/button";
import { Dialog, DialogActions, DialogContent, DialogHeader } from "~/components/ui/dialog";
import { useTasks } from "../state/context";

/** Confirmation for destructive actions. Driven by `dialogs.confirmRequest()`. */
export function ConfirmDialog() {
  const { dialogs } = useTasks();

  const confirm = () => {
    const request = dialogs.confirmRequest();
    dialogs.dismissConfirm();
    request?.onConfirm();
  };

  return (
    <Dialog open={dialogs.confirmRequest() !== null} onOpenChange={(open) => !open && dialogs.dismissConfirm()}>
      <DialogContent class="max-w-[25rem]">
        <DialogHeader
          icon="triangle-alert"
          title={dialogs.confirmRequest()?.title ?? ""}
          description={dialogs.confirmRequest()?.description}
        />
        <DialogActions>
          <Button variant="text" onClick={dialogs.dismissConfirm}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm}>
            {dialogs.confirmRequest()?.confirmLabel}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

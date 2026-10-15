import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";

interface CrashScreenProps {
  error: unknown;
  /** Re-render the app (ErrorBoundary's reset). */
  reset: () => void;
}

/**
 * Shown by the root <ErrorBoundary> when rendering throws, instead of a blank
 * window. Tasks are safe on disk (Rust owns them), so retrying is harmless.
 */
export function CrashScreen(props: CrashScreenProps) {
  const [copied, setCopied] = createSignal(false);
  const details = () =>
    props.error instanceof Error ? `${props.error.message}\n\n${props.error.stack ?? ""}` : String(props.error);

  async function copyDetails() {
    await navigator.clipboard?.writeText(details());
    setCopied(true);
  }

  return (
    <main role="alert" class="flex h-screen flex-col items-center justify-center gap-6 bg-surface p-6 text-center">
      <Icon name="triangle-alert" size={48} class="text-error" />
      <div class="flex max-w-md flex-col gap-2">
        <h1 class="text-headline-small text-on-surface">Something went wrong</h1>
        <p class="text-body-large text-on-surface-variant">
          Doable hit an unexpected error. Your tasks are saved; reloading usually fixes it.
        </p>
      </div>
      <pre class="max-h-40 w-full max-w-xl overflow-auto rounded-md bg-surface-container p-3 text-left text-body-small text-on-surface-variant">
        {details()}
      </pre>
      <div class="flex gap-2">
        <Button variant="text" onClick={copyDetails}>
          {copied() ? "Copied" : "Copy details"}
        </Button>
        <Button variant="tonal" onClick={props.reset}>
          Try again
        </Button>
        <Button onClick={() => location.reload()}>
          Reload
        </Button>
      </div>
    </main>
  );
}

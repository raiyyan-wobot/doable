import { ErrorBoundary } from "solid-js";
import { AppShell } from "~/app/AppShell";
import { CrashScreen } from "~/app/CrashScreen";
import { TasksProvider } from "~/features/tasks";
import { ThemeProvider } from "~/theme";

/**
 * Root: app-wide providers only. Layout lives in app/AppShell.tsx.
 * The ErrorBoundary sits inside ThemeProvider so the crash screen is themed.
 */
export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary fallback={(error, reset) => <CrashScreen error={error} reset={reset} />}>
        <TasksProvider>
          <AppShell />
        </TasksProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

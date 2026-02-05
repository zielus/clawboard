// src/App.tsx
import { ThemeProvider } from "@/components/theme-provider";
import { TasksPage } from "@/pages/tasks";

export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TasksPage />
    </ThemeProvider>
  );
}

export default App;

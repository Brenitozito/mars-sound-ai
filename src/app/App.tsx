import { TooltipProvider } from "@radix-ui/react-tooltip";
import { RouterProvider } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { router } from "./routes/router";

const TOOLTIP_OPEN_DELAY_MS = 400;
const TOOLTIP_SKIP_DELAY_MS = 200;

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={TOOLTIP_OPEN_DELAY_MS} skipDelayDuration={TOOLTIP_SKIP_DELAY_MS}>
        <RouterProvider router={router} />
      </TooltipProvider>
      <Toaster position="top-center" richColors closeButton />
    </AuthProvider>
  );
}

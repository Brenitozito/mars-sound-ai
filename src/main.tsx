import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { ConfigurationErrorScreen } from "./app/components/feedback/ConfigurationErrorScreen";
import { findMissingSupabaseEnv } from "./app/services/supabase/client";
import "./styles/index.css";

const missingEnvNames = findMissingSupabaseEnv();

createRoot(document.getElementById("root")!).render(
  missingEnvNames.length > 0 ? <ConfigurationErrorScreen missingEnvNames={missingEnvNames} /> : <App />,
);

import imgAuthBackground from "figma:asset/dd6a162f4eb13b36696ba6e356b8e8df40db09c3.webp";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import {
  ForgotRequestForm,
  ForgotResetForm,
  ForgotSuccessView,
  LoginForm,
  RegisterForm,
  SignUpConfirmationView,
} from "../components/auth/AuthForms";
import { BrandLogo } from "../components/auth/AuthPrimitives";
import { useAuth } from "../context/AuthContext";
import { usePageMeta } from "../hooks/usePageMeta";

type AuthView = "login" | "register" | "register-confirm" | "forgot-request" | "forgot-success" | "forgot-reset";

const VIEW_HEADINGS: Record<AuthView, string> = {
  login: "Escute músicas geradas com IA e compartilhe suas criações",
  register: "Crie sua conta",
  "register-confirm": "Verifique seu e-mail",
  "forgot-request": "Recuperar senha",
  "forgot-success": "Verifique seu e-mail",
  "forgot-reset": "Nova senha",
};

const VIEW_DOCUMENT_TITLES: Record<AuthView, string> = {
  login: "Entrar",
  register: "Criar conta",
  "register-confirm": "Confirmar e-mail",
  "forgot-request": "Recuperar senha",
  "forgot-success": "Recuperar senha",
  "forgot-reset": "Nova senha",
};

const AUTH_PAGE_DESCRIPTION =
  "Entre ou crie sua conta na Mars Sound AI para ouvir, publicar e compartilhar músicas criadas com inteligência artificial.";

export default function AuthPage() {
  const { isRecoveringPassword } = useAuth();
  const [view, setView] = useState<AuthView>(isRecoveringPassword ? "forgot-reset" : "login");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState("");
  usePageMeta(VIEW_DOCUMENT_TITLES[view], AUTH_PAGE_DESCRIPTION);

  useEffect(() => {
    if (isRecoveringPassword) setView("forgot-reset");
  }, [isRecoveringPassword]);

  const goToLogin = () => setView("login");

  const viewContent: Record<AuthView, ReactNode> = {
    login: (
      <LoginForm
        initialEmail={recoveryEmail}
        onGoRegister={() => setView("register")}
        onGoForgot={(email) => {
          setRecoveryEmail(email);
          setView("forgot-request");
        }}
      />
    ),
    register: (
      <RegisterForm
        onGoLogin={goToLogin}
        onConfirmationPending={(email) => {
          setPendingConfirmationEmail(email);
          setView("register-confirm");
        }}
      />
    ),
    "register-confirm": <SignUpConfirmationView email={pendingConfirmationEmail} onGoLogin={goToLogin} />,
    "forgot-request": (
      <ForgotRequestForm
        initialEmail={recoveryEmail}
        onBack={goToLogin}
        onSent={(email) => {
          setRecoveryEmail(email);
          setView("forgot-success");
        }}
      />
    ),
    "forgot-success": <ForgotSuccessView email={recoveryEmail} onGoLogin={goToLogin} />,
    "forgot-reset": <ForgotResetForm onBack={goToLogin} />,
  };

  return (
    <div className="flex min-h-dvh w-full overflow-hidden bg-[#1c1315]">
      <div className="relative hidden min-h-dvh flex-col items-center justify-center lg:flex lg:w-[60%]">
        <img src={imgAuthBackground} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c1315]/30 to-[#1c1315]/60" />
      </div>

      <main className="flex min-h-dvh w-full flex-col items-center justify-center px-6 py-12 lg:w-[40%]">
        <div className="flex w-full max-w-[399px] flex-col items-center gap-10">
          <header className="flex w-full flex-col items-center gap-4 lg:gap-6">
            <BrandLogo />
            <h1 className="max-w-[320px] text-center text-[14px] font-semibold leading-[1.5] text-[#a19a9b] lg:text-[18px]">
              {VIEW_HEADINGS[view]}
            </h1>
          </header>

          <div className="w-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {viewContent[view]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

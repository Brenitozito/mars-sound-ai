import { Link } from "react-router";
import { EmptyState } from "../components/feedback/StatusViews";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/button";
import { usePageMeta } from "../hooks/usePageMeta";
import { ROUTES } from "../routes/paths";

interface NotFoundPageProps {
  title?: string;
  description?: string;
}

export function NotFoundPage({
  title = "Página não encontrada",
  description = "O endereço acessado não existe ou foi removido.",
}: NotFoundPageProps) {
  usePageMeta(title, description);

  return (
    <PageContainer>
      <EmptyState
        title={title}
        description={description}
        className="min-h-[50vh]"
        action={
          <Button asChild variant="primary" size="touch">
            <Link to={ROUTES.home}>Voltar para o início</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}

export default NotFoundPage;

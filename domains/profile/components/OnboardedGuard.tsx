import { requireOnboarded } from "../services/profile";

/**
 * Redireciona ao onboarding quem ainda não concluiu. Renderizado ao lado do conteúdo (dentro de <Suspense>),
 * não em volta: a página começa a buscar dados em paralelo, sem esperar sessão + perfil.
 */
export const OnboardedGuard = async () => {
  await requireOnboarded();
  return null;
};

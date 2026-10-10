import { userService } from "../services";
import type { ProfileStats } from "../types/domain";
import { useAsyncData } from "./useAsyncData";

/**
 * Estatísticas são complementares: em caso de falha o cabeçalho mostra apenas os dados do perfil.
 * Seguidores/seguindo vêm sempre do próprio perfil, que é atualizado na hora ao seguir.
 */
export function useProfileStats(profileId: string | undefined): ProfileStats | undefined {
  const { data } = useAsyncData(
    () => (profileId ? userService.getProfileStats(profileId) : Promise.resolve(undefined)),
    [profileId],
  );
  return data;
}

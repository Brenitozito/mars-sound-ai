-- Default privileges por schema só adicionam permissões: não removem o EXECUTE global de PUBLIC.
-- Toda função nova em private precisa de REVOKE explícito.
revoke execute on function
  private.clamp_limit(integer, integer),
  private.weekly_play_counts(timestamptz),
  private.claim_owned_playlist(uuid)
from public, anon;

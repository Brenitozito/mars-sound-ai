-- Smoke test de RLS, privilégios, triggers e RPCs do Mars Sound AI.
-- Roda tudo dentro de um único bloco DO e SEMPRE termina em RAISE EXCEPTION: o relatório chega na
-- mensagem de erro e todas as escritas (usuários, perfis, faixas, storage) sofrem rollback.
do $$
declare
  v_user_a constant uuid := '00000000-0000-4000-a000-00000000000a';
  v_user_b constant uuid := '00000000-0000-4000-a000-00000000000b';
  v_user_c constant uuid := '00000000-0000-4000-a000-00000000000c';
  v_handle_a text;
  v_handle_b text;
  v_profile public.profiles%rowtype;
  v_track_published uuid;
  v_track_draft uuid;
  v_track_b uuid;
  v_playlist_private uuid;
  v_playlist_public uuid;
  v_rows bigint;
  v_count bigint;
  v_text text;
  v_moods text[];
  v_first_id uuid;
  v_stats record;
  v_total integer := 0;
  v_failures text[] := '{}';
  v_current_scenario integer := 0;
  v_aborted boolean := false;
  v_context text;
  v_report text;
  v_status text;
begin
  begin
    -- -----------------------------------------------------------------------
    -- S1: trigger de criação de perfil
    -- -----------------------------------------------------------------------
    v_current_scenario := 1;

    insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
    values
      (v_user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'qa-a@example.com',
        '{"display_name": "QA Alice"}', '{"provider": "email", "providers": ["email"]}', now(), now()),
      (v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'qa-b@example.com',
        '{"display_name": "QA Bruno"}', '{"provider": "email", "providers": ["email"]}', now(), now()),
      (v_user_c, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'qa+a@example.com',
        '{}', '{"provider": "email", "providers": ["email"]}', now(), now());

    select handle into v_handle_a from public.profiles where id = v_user_a;
    select handle into v_handle_b from public.profiles where id = v_user_b;

    v_total := v_total + 1;
    if not coalesce(v_handle_a = 'qaa' and (select display_name from public.profiles where id = v_user_a) = 'QA Alice', false) then
      v_failures := array_append(v_failures, format('S1: perfil de A inesperado (handle=%s)', v_handle_a));
    end if;

    v_total := v_total + 1;
    if not coalesce(v_handle_b = 'qab' and (select display_name from public.profiles where id = v_user_b) = 'QA Bruno', false) then
      v_failures := array_append(v_failures, format('S1: perfil de B inesperado (handle=%s)', v_handle_b));
    end if;

    select * into v_profile from public.profiles where id = v_user_c;
    v_total := v_total + 1;
    if not coalesce(v_profile.handle ~ '^qaa_[0-9]{4}$' and v_profile.display_name = 'qa+a', false) then
      v_failures := array_append(v_failures,
        format('S1: colisão de handle não tratada (handle=%s, display_name=%s)', v_profile.handle, v_profile.display_name));
    end if;

    -- -----------------------------------------------------------------------
    -- S2: A atualiza o próprio perfil
    -- -----------------------------------------------------------------------
    v_current_scenario := 2;
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);

    update public.profiles
    set bio = 'Produtora de faixas de IA',
        favorite_genres = array['Pop', 'Rock', 'Pop'],
        moods = array['Calmo', 'Calmo']
    where id = v_user_a;
    get diagnostics v_rows = row_count;
    select * into v_profile from public.profiles where id = v_user_a;

    v_total := v_total + 1;
    if not coalesce(v_rows = 1 and v_profile.favorite_genres = array['Pop', 'Rock'] and v_profile.moods = array['Calmo']
                    and v_profile.bio = 'Produtora de faixas de IA', false) then
      v_failures := array_append(v_failures,
        format('S2: atualização/deduplicação falhou (rows=%s, genres=%s, moods=%s)', v_rows, v_profile.favorite_genres, v_profile.moods));
    end if;

    v_total := v_total + 1;
    begin
      update public.profiles set favorite_genres = array['Country'] where id = v_user_a;
      v_failures := array_append(v_failures, 'S2: gênero inválido foi aceito');
    exception when others then
      if sqlstate <> '23514' then
        v_failures := array_append(v_failures, format('S2: gênero inválido -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      update public.profiles set moods = array['Melancólico'] where id = v_user_a;
      v_failures := array_append(v_failures, 'S2: mood inválido foi aceito');
    exception when others then
      if sqlstate <> '23514' then
        v_failures := array_append(v_failures, format('S2: mood inválido -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      update public.profiles set avatar_path = v_user_b || '/avatar.png' where id = v_user_a;
      v_failures := array_append(v_failures, 'S2: avatar apontando para pasta alheia foi aceito');
    exception when others then
      if sqlstate <> '23514' then
        v_failures := array_append(v_failures, format('S2: avatar alheio -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    -- -----------------------------------------------------------------------
    -- S3: A não altera colunas protegidas nem o perfil de B
    -- -----------------------------------------------------------------------
    v_current_scenario := 3;

    v_total := v_total + 1;
    begin
      update public.profiles set role = 'admin' where id = v_user_a;
      v_failures := array_append(v_failures, 'S3: A alterou o próprio role');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S3: role -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      update public.profiles set followers_count = 999 where id = v_user_a;
      v_failures := array_append(v_failures, 'S3: A alterou followers_count');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S3: followers_count -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      update public.profiles set bio = 'invadido' where id = v_user_b;
      get diagnostics v_rows = row_count;
      if v_rows <> 0 then
        v_failures := array_append(v_failures, 'S3: A alterou o perfil de B');
      end if;
    exception when insufficient_privilege then
      null;
    end;

    -- -----------------------------------------------------------------------
    -- S4: faixas de A
    -- -----------------------------------------------------------------------
    v_current_scenario := 4;

    insert into public.tracks (artist_id, title, genre, album, tags, audio_path, duration_seconds, status)
    values (v_user_a, 'Noite Elétrica', 'Pop', 'Cidade Neon', array['synth', 'neon'], v_user_a || '/noite.mp3', 180, 'published')
    returning id into v_track_published;

    insert into public.tracks (artist_id, title, genre, audio_path, duration_seconds, status)
    values (v_user_a, 'Rascunho Secreto', 'Pop', v_user_a || '/rascunho.mp3', 120, 'draft')
    returning id into v_track_draft;

    v_total := v_total + 1;
    if v_track_published is null or v_track_draft is null then
      v_failures := array_append(v_failures, 'S4: A não conseguiu criar faixa publicada e rascunho');
    end if;

    v_total := v_total + 1;
    begin
      insert into public.tracks (artist_id, title, genre, audio_path, duration_seconds, play_count)
      values (v_user_a, 'Forjada', 'Pop', v_user_a || '/f.mp3', 60, 999);
      v_failures := array_append(v_failures, 'S4: insert com play_count explícito foi aceito');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S4: play_count -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      insert into public.tracks (artist_id, title, genre, audio_path, duration_seconds, status)
      values (v_user_a, 'Rejeitada', 'Pop', v_user_a || '/r.mp3', 60, 'rejected');
      v_failures := array_append(v_failures, 'S4: insert com status rejected foi aceito');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S4: rejected -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      update public.tracks set cover_path = v_user_b || '/capa.png' where id = v_track_published;
      v_failures := array_append(v_failures, 'S4: capa apontando para pasta alheia foi aceita');
    exception when others then
      if sqlstate <> '23514' then
        v_failures := array_append(v_failures, format('S4: capa alheia -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    -- -----------------------------------------------------------------------
    -- S5: moods da faixa
    -- -----------------------------------------------------------------------
    v_current_scenario := 5;

    v_total := v_total + 1;
    begin
      insert into public.track_moods (track_id, mood) values (v_track_published, 'Triste');
      v_failures := array_append(v_failures, 'S5: mood inexistente foi aceito');
    exception when others then
      if sqlstate <> '23503' then
        v_failures := array_append(v_failures, format('S5: mood inexistente -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    insert into public.track_moods (track_id, mood) values (v_track_published, 'Calmo');
    insert into public.track_moods (track_id, mood) values (v_track_published, 'Festivo');
    insert into public.track_moods (track_id, mood) values (v_track_published, 'Romântico');

    v_total := v_total + 1;
    begin
      insert into public.track_moods (track_id, mood) values (v_track_published, 'Divertido');
      v_failures := array_append(v_failures, 'S5: 4º mood foi aceito');
    exception when others then
      if sqlstate <> '23514' then
        v_failures := array_append(v_failures, format('S5: 4º mood -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    -- -----------------------------------------------------------------------
    -- S6: visibilidade das faixas de A para B
    -- -----------------------------------------------------------------------
    v_current_scenario := 6;
    perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);

    v_total := v_total + 1;
    select count(*) into v_count from public.tracks where id = v_track_published;
    if v_count <> 1 then
      v_failures := array_append(v_failures, 'S6: B não vê a faixa publicada de A');
    end if;

    v_total := v_total + 1;
    select count(*) into v_count from public.tracks where id = v_track_draft;
    if v_count <> 0 then
      v_failures := array_append(v_failures, 'S6: B vê o rascunho de A');
    end if;

    select artist_handle, moods into v_text, v_moods from public.tracks_with_artist where id = v_track_published;
    v_total := v_total + 1;
    if not coalesce(v_text = v_handle_a and v_moods @> array['Calmo', 'Festivo', 'Romântico'] and cardinality(v_moods) = 3, false) then
      v_failures := array_append(v_failures, format('S6: tracks_with_artist inesperada (handle=%s, moods=%s)', v_text, v_moods));
    end if;

    v_total := v_total + 1;
    begin
      update public.tracks set title = 'Hackeada' where id = v_track_published;
      get diagnostics v_rows = row_count;
      if v_rows <> 0 then
        v_failures := array_append(v_failures, 'S6: B alterou a faixa de A');
      end if;
    exception when insufficient_privilege then
      null;
    end;

    v_total := v_total + 1;
    begin
      delete from public.tracks where id = v_track_published;
      get diagnostics v_rows = row_count;
      if v_rows <> 0 then
        v_failures := array_append(v_failures, 'S6: B apagou a faixa de A');
      end if;
    exception when insufficient_privilege then
      null;
    end;

    -- -----------------------------------------------------------------------
    -- S7: perfil privado
    -- -----------------------------------------------------------------------
    v_current_scenario := 7;
    perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
    update public.profiles set is_public = false where id = v_user_a;

    perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);

    v_total := v_total + 1;
    select count(*) into v_count from public.profiles where id = v_user_a;
    if v_count <> 0 then
      v_failures := array_append(v_failures, 'S7: B lê o perfil privado de A');
    end if;

    v_total := v_total + 1;
    select artist_handle into v_text from public.tracks_with_artist where id = v_track_published;
    if v_text is distinct from v_handle_a then
      v_failures := array_append(v_failures, format('S7: artist_handle sumiu com perfil privado (%s)', v_text));
    end if;

    perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
    update public.profiles set is_public = true where id = v_user_a;

    -- -----------------------------------------------------------------------
    -- S8: playlists privada e pública
    -- -----------------------------------------------------------------------
    v_current_scenario := 8;

    insert into public.playlists (owner_id, title, is_public)
    values (v_user_a, 'QA Privada', false)
    returning id into v_playlist_private;

    insert into public.playlists (owner_id, title, is_public)
    values (v_user_a, 'QA Pública', true)
    returning id into v_playlist_public;

    perform public.add_track_to_playlist(v_playlist_private, v_track_published);

    v_total := v_total + 1;
    begin
      update public.playlists set cover_path = v_user_b || '/capa.png' where id = v_playlist_public;
      v_failures := array_append(v_failures, 'S8: capa de playlist apontando para pasta alheia foi aceita');
    exception when others then
      if sqlstate <> '23514' then
        v_failures := array_append(v_failures, format('S8: capa alheia -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);

    v_total := v_total + 1;
    select count(*) into v_count from public.playlists where id = v_playlist_private;
    if v_count <> 0 then
      v_failures := array_append(v_failures, 'S8: B vê a playlist privada de A');
    end if;

    v_total := v_total + 1;
    select count(*) into v_count from public.playlist_tracks where playlist_id = v_playlist_private;
    if v_count <> 0 then
      v_failures := array_append(v_failures, 'S8: B vê as faixas da playlist privada de A');
    end if;

    v_total := v_total + 1;
    select count(*) into v_count from public.playlists where id = v_playlist_public;
    if v_count <> 1 then
      v_failures := array_append(v_failures, 'S8: B não vê a playlist pública de A');
    end if;

    v_total := v_total + 1;
    begin
      perform public.add_track_to_playlist(v_playlist_public, v_track_published);
      v_failures := array_append(v_failures, 'S8: B adicionou faixa na playlist de A');
    exception when others then
      if sqlstate <> 'PT404' then
        v_failures := array_append(v_failures, format('S8: add na playlist alheia -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    -- -----------------------------------------------------------------------
    -- S9: RPCs de playlist
    -- -----------------------------------------------------------------------
    v_current_scenario := 9;
    perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);

    perform public.add_track_to_playlist(v_playlist_public, v_track_published);
    perform public.add_track_to_playlist(v_playlist_public, v_track_draft);

    v_total := v_total + 1;
    select string_agg(pt.track_id::text || ':' || pt.position, ',' order by pt.position) into v_text
    from public.playlist_tracks pt where pt.playlist_id = v_playlist_public;
    if v_text is distinct from (v_track_published || ':0,' || v_track_draft || ':1') then
      v_failures := array_append(v_failures, format('S9: posições após add inesperadas (%s)', v_text));
    end if;

    v_total := v_total + 1;
    begin
      perform public.add_track_to_playlist(v_playlist_public, v_track_published);
      v_failures := array_append(v_failures, 'S9: faixa duplicada foi aceita');
    exception when others then
      if sqlstate <> 'PT409' then
        v_failures := array_append(v_failures, format('S9: duplicada -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    perform public.reorder_playlist_tracks(v_playlist_public, array[v_track_draft, v_track_published]);
    set constraints all immediate;
    set constraints all deferred;

    v_total := v_total + 1;
    select string_agg(pt.track_id::text || ':' || pt.position, ',' order by pt.position) into v_text
    from public.playlist_tracks pt where pt.playlist_id = v_playlist_public;
    if v_text is distinct from (v_track_draft || ':0,' || v_track_published || ':1') then
      v_failures := array_append(v_failures, format('S9: reorder não inverteu (%s)', v_text));
    end if;

    v_total := v_total + 1;
    begin
      perform public.reorder_playlist_tracks(v_playlist_public, array[v_track_published]);
      v_failures := array_append(v_failures, 'S9: reorder com conjunto incompleto foi aceito');
    exception when others then
      if sqlstate <> 'PT409' then
        v_failures := array_append(v_failures, format('S9: reorder incompleto -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      perform public.reorder_playlist_tracks(v_playlist_public, array[v_track_published, v_track_published]);
      v_failures := array_append(v_failures, 'S9: reorder com duplicata foi aceito');
    exception when others then
      if sqlstate <> 'PT409' then
        v_failures := array_append(v_failures, format('S9: reorder duplicado -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    perform public.remove_track_from_playlist(v_playlist_public, v_track_draft);
    set constraints all immediate;
    set constraints all deferred;

    v_total := v_total + 1;
    select string_agg(pt.track_id::text || ':' || pt.position, ',' order by pt.position) into v_text
    from public.playlist_tracks pt where pt.playlist_id = v_playlist_public;
    if v_text is distinct from (v_track_published || ':0') then
      v_failures := array_append(v_failures, format('S9: remove não recompactou (%s)', v_text));
    end if;

    -- -----------------------------------------------------------------------
    -- S10: follows, contadores e notificação
    -- -----------------------------------------------------------------------
    v_current_scenario := 10;
    perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);

    insert into public.follows (follower_id, followed_id) values (v_user_b, v_user_a);

    v_total := v_total + 1;
    if not coalesce((select followers_count from public.profiles where id = v_user_a) = 1
                    and (select following_count from public.profiles where id = v_user_b) = 1, false) then
      v_failures := array_append(v_failures, 'S10: contadores após follow incorretos');
    end if;

    v_total := v_total + 1;
    select count(*) into v_count from public.notifications where user_id = v_user_a;
    if v_count <> 0 then
      v_failures := array_append(v_failures, 'S10: B lê notificações de A');
    end if;

    perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
    v_total := v_total + 1;
    select count(*) into v_count from public.notifications
    where user_id = v_user_a and type = 'follow' and actor_id = v_user_b and entity_type = 'user';
    if v_count <> 1 then
      v_failures := array_append(v_failures, format('S10: notificação de follow para A = %s', v_count));
    end if;

    perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
    delete from public.follows where follower_id = v_user_b and followed_id = v_user_a;

    v_total := v_total + 1;
    if not coalesce((select followers_count from public.profiles where id = v_user_a) = 0
                    and (select following_count from public.profiles where id = v_user_b) = 0, false) then
      v_failures := array_append(v_failures, 'S10: contadores após unfollow incorretos');
    end if;

    insert into public.follows (follower_id, followed_id) values (v_user_b, v_user_a);
    perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
    v_total := v_total + 1;
    select count(*) into v_count from public.notifications
    where user_id = v_user_a and type = 'follow' and actor_id = v_user_b;
    if v_count <> 1 then
      v_failures := array_append(v_failures, format('S10: seguir de novo gerou %s notificações', v_count));
    end if;
    perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
    delete from public.follows where follower_id = v_user_b and followed_id = v_user_a;

    -- -----------------------------------------------------------------------
    -- S11: plays
    -- -----------------------------------------------------------------------
    v_current_scenario := 11;

    insert into public.tracks (artist_id, title, genre, audio_path, duration_seconds, status)
    values (v_user_b, 'Faixa do Bruno', 'Rock', v_user_b || '/bruno.mp3', 200, 'published')
    returning id into v_track_b;

    insert into public.plays (user_id, track_id) values (v_user_b, v_track_published);

    v_total := v_total + 1;
    select play_count into v_count from public.tracks where id = v_track_published;
    if v_count <> 1 then
      v_failures := array_append(v_failures, format('S11: play_count após play de B = %s', v_count));
    end if;

    insert into public.plays (user_id, track_id) values (v_user_b, v_track_published);
    insert into public.plays (user_id, track_id) values (v_user_b, v_track_published);
    v_total := v_total + 1;
    select play_count into v_count from public.tracks where id = v_track_published;
    if v_count <> 1 then
      v_failures := array_append(v_failures, format('S11: plays repetidos inflaram play_count para %s', v_count));
    end if;

    v_total := v_total + 1;
    begin
      insert into public.tracks (artist_id, title, genre, audio_path, duration_seconds, status)
      values (v_user_b, 'Arquivo Alheio', 'Rock', v_user_a || '/noite.mp3', 180, 'published');
      v_failures := array_append(v_failures, 'S11: B criou faixa apontando para o áudio de A');
    exception when others then
      if sqlstate <> '23514' then
        v_failures := array_append(v_failures, format('S11: áudio alheio -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      insert into public.plays (user_id, track_id, played_at) values (v_user_b, v_track_published, now() - interval '30 days');
      v_failures := array_append(v_failures, 'S11: B forjou played_at');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S11: played_at -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
    insert into public.plays (user_id, track_id) values (v_user_a, v_track_published);

    perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);

    v_total := v_total + 1;
    select count(*) into v_count from public.plays where user_id = v_user_a;
    if v_count <> 0 then
      v_failures := array_append(v_failures, 'S11: B vê plays de A');
    end if;

    v_total := v_total + 1;
    select id into v_first_id from public.get_weekly_highlights(5) limit 1;
    if v_first_id is distinct from v_track_published then
      v_failures := array_append(v_failures, 'S11: get_weekly_highlights não trouxe a faixa mais tocada primeiro');
    end if;

    v_total := v_total + 1;
    if not exists (select 1 from public.get_recently_played(5) rp where rp.track_id = v_track_published) then
      v_failures := array_append(v_failures, 'S11: get_recently_played de B não trouxe a faixa');
    end if;

    -- -----------------------------------------------------------------------
    -- S12: favoritos, likes e notificação
    -- -----------------------------------------------------------------------
    v_current_scenario := 12;

    insert into public.favorites (user_id, track_id) values (v_user_b, v_track_published);
    insert into public.likes (user_id, track_id) values (v_user_b, v_track_published);

    v_total := v_total + 1;
    if not coalesce((select like_count from public.tracks where id = v_track_published) = 1
                    and exists (select 1 from public.favorites where user_id = v_user_b and track_id = v_track_published), false) then
      v_failures := array_append(v_failures, 'S12: like_count/favorito de B incorretos');
    end if;

    perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);

    v_total := v_total + 1;
    select count(*) into v_count from public.notifications where user_id = v_user_a and type = 'like';
    if v_count <> 1 then
      v_failures := array_append(v_failures, format('S12: notificações de like para A = %s (esperado 1)', v_count));
    end if;

    insert into public.likes (user_id, track_id) values (v_user_a, v_track_published);

    v_total := v_total + 1;
    select count(*) into v_count from public.notifications where user_id = v_user_a and type = 'like';
    if v_count <> 1 or (select like_count from public.tracks where id = v_track_published) <> 2 then
      v_failures := array_append(v_failures, 'S12: like próprio gerou notificação ou não contou');
    end if;

    -- -----------------------------------------------------------------------
    -- S13: busca, recomendações e estatísticas
    -- -----------------------------------------------------------------------
    v_current_scenario := 13;
    perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
    update public.profiles set favorite_genres = array['Pop'] where id = v_user_b;

    v_total := v_total + 1;
    if not exists (select 1 from public.search_tracks('eletrica') s where s.id = v_track_published) then
      v_failures := array_append(v_failures, 'S13: busca sem acento (eletrica) não achou "Noite Elétrica"');
    end if;

    v_total := v_total + 1;
    if not exists (select 1 from public.search_tracks('ELÉTRICA', '{}', '{}', 'recent') s where s.id = v_track_published and s.total_count = 1) then
      v_failures := array_append(v_failures, 'S13: busca com acento/maiúsculas falhou');
    end if;

    v_total := v_total + 1;
    if not exists (select 1 from public.search_tracks('@' || v_handle_a) s where s.id = v_track_published)
       or exists (select 1 from public.search_tracks('@' || v_handle_a) s where s.id = v_track_b) then
      v_failures := array_append(v_failures, 'S13: busca por @handle de A incorreta');
    end if;

    v_total := v_total + 1;
    if not exists (select 1 from public.search_tracks('', '{}', array['Calmo']) s where s.id = v_track_published)
       or exists (select 1 from public.search_tracks('', '{}', array['Calmo']) s where s.id = v_track_b)
       or exists (select 1 from public.search_tracks('', '{}', array['Divertido']) s where s.id = v_track_published) then
      v_failures := array_append(v_failures, 'S13: filtro de mood incorreto');
    end if;

    v_total := v_total + 1;
    if not exists (select 1 from public.search_tracks('', array['Rock']) s where s.id = v_track_b)
       or exists (select 1 from public.search_tracks('', array['Rock']) s where s.id = v_track_published) then
      v_failures := array_append(v_failures, 'S13: filtro de gênero incorreto');
    end if;

    v_total := v_total + 1;
    begin
      perform public.search_tracks('', '{}', '{}', 'aleatorio');
      v_failures := array_append(v_failures, 'S13: ordenação inválida foi aceita');
    exception when others then
      if sqlstate <> '23514' then
        v_failures := array_append(v_failures, format('S13: ordenação inválida -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    select id into v_first_id from public.get_recommended_tracks(10) limit 1;
    if v_first_id is distinct from v_track_published
       or exists (select 1 from public.get_recommended_tracks(50) r where r.artist_id = v_user_b) then
      v_failures := array_append(v_failures, 'S13: get_recommended_tracks incorreto');
    end if;

    v_total := v_total + 1;
    select * into v_stats from public.get_profile_stats(v_user_a);
    if not coalesce(v_stats.tracks_count = 1 and v_stats.total_plays = 2
                    and v_stats.followers_count = 0 and v_stats.following_count = 0, false) then
      v_failures := array_append(v_failures, format('S13: get_profile_stats(A) inesperado (%s)', v_stats));
    end if;

    v_total := v_total + 1;
    if not exists (select 1 from public.get_featured_genres() g where g.genre = 'Pop' and g.track_count = 1) then
      v_failures := array_append(v_failures, 'S13: get_featured_genres não trouxe Pop');
    end if;

    v_total := v_total + 1;
    if not exists (select 1 from public.get_popular_tags() t where t.tag = 'synth' and t.track_count = 1) then
      v_failures := array_append(v_failures, 'S13: get_popular_tags não trouxe a tag synth da faixa publicada');
    end if;

    v_total := v_total + 1;
    if (select count(*) from public.ai_generators) < 1 then
      v_failures := array_append(v_failures, 'S13: authenticated não leu ai_generators');
    end if;

    v_total := v_total + 1;
    begin
      insert into public.ai_generators (name) values ('Gerador Falso');
      v_failures := array_append(v_failures, 'S13: authenticated gravou em ai_generators');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S13: insert ai_generators -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    -- -----------------------------------------------------------------------
    -- S14: storage
    -- -----------------------------------------------------------------------
    v_current_scenario := 14;
    perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);

    v_total := v_total + 1;
    begin
      insert into storage.objects (bucket_id, name) values ('track-covers', v_user_a || '/teste.jpg');
    exception when others then
      v_failures := array_append(v_failures, format('S14: upload na própria pasta falhou -> %s (%s)', sqlstate, sqlerrm));
    end;

    v_total := v_total + 1;
    begin
      insert into storage.objects (bucket_id, name) values ('track-covers', v_user_b || '/x.jpg');
      v_failures := array_append(v_failures, 'S14: A gravou na pasta de B');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S14: pasta alheia -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
    v_total := v_total + 1;
    select count(*) into v_count from storage.objects where name = v_user_a || '/teste.jpg';
    if v_count <> 0 then
      v_failures := array_append(v_failures, 'S14: B lista arquivos de A');
    end if;

    -- -----------------------------------------------------------------------
    -- S15: anon sem acesso
    -- -----------------------------------------------------------------------
    v_current_scenario := 15;
    perform set_config('role', 'anon', true);
    perform set_config('request.jwt.claims', '{"role": "anon"}', true);

    v_total := v_total + 1;
    begin
      perform 1 from public.genres;
      v_failures := array_append(v_failures, 'S15: anon leu genres');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S15: genres -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      perform 1 from public.tracks;
      v_failures := array_append(v_failures, 'S15: anon leu tracks');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S15: tracks -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      perform 1 from public.tracks_with_artist;
      v_failures := array_append(v_failures, 'S15: anon leu tracks_with_artist');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S15: tracks_with_artist -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      perform public.search_tracks();
      v_failures := array_append(v_failures, 'S15: anon executou search_tracks');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S15: search_tracks -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      perform 1 from public.ai_generators;
      v_failures := array_append(v_failures, 'S15: anon leu ai_generators');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S15: ai_generators -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

    v_total := v_total + 1;
    begin
      perform public.get_popular_tags();
      v_failures := array_append(v_failures, 'S15: anon executou get_popular_tags');
    exception when others then
      if sqlstate <> '42501' then
        v_failures := array_append(v_failures, format('S15: get_popular_tags -> sqlstate %s (%s)', sqlstate, sqlerrm));
      end if;
    end;

  exception when others then
    get stacked diagnostics v_context = pg_exception_context;
    v_aborted := true;
    v_total := v_total + 1;
    v_failures := array_append(v_failures,
      format('S%s: ERRO INESPERADO [%s] %s | %s', v_current_scenario, sqlstate, sqlerrm, v_context));
  end;

  v_report := format('RESULTADO: %s/%s verificações OK', v_total - cardinality(v_failures), v_total);
  for scenario in 1..15 loop
    v_status := case
      when v_aborted and scenario > v_current_scenario then 'NÃO EXECUTADO'
      when exists (select 1 from unnest(v_failures) f where f like 'S' || scenario || ':%') then 'FALHA'
      else 'OK'
    end;
    v_report := v_report || E'\n' || format('S%s: %s', scenario, v_status);
  end loop;
  if cardinality(v_failures) > 0 then
    v_report := v_report || E'\nFALHAS:\n' || array_to_string(v_failures, E'\n');
  end if;

  raise exception '%', v_report;
end;
$$;

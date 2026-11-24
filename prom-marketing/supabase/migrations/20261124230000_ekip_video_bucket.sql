-- Частен бъкет за обучителното видео на екипа по продажбите.
-- Гледа се само след вход в /ekip (подписан линк от сървъра), никога публично.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ekip-video', 'ekip-video', false, 104857600, array['video/mp4'])
on conflict (id) do nothing;

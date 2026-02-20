INSERT INTO gestao_patrimonio.profiles (id, user_id, name, department, created_at, updated_at) VALUES
  ('618cac7d-2be2-465d-bdba-32d5e0079e45', 'be91b6ea-1241-4a68-98ac-df617f355482', 'daniely.vasconcelos@yellowkite.digital', NULL, '2026-02-19 13:23:52.528055+00', '2026-02-19 13:23:52.528055+00'),
  ('db24a1a7-395e-4bf5-953c-4cd45824a8e6', 'f7ab981b-5272-4373-aa12-ebf43111ac4d', 'user.teste@yellowkite.digital', 'Audiovisual', '2026-02-19 13:29:55.607686+00', '2026-02-19 13:30:49.861036+00'),
  ('61d795cd-8c43-4fc8-b2bf-866a26cf4fcf', 'afbe83a3-b42c-4525-a682-ec3e7d4f575e', 'adm@yellowkite.digital', NULL, '2026-02-19 14:19:59.552598+00', '2026-02-19 14:19:59.552598+00'),
  ('b94b0a95-5f87-471a-9719-615e8789923f', '48c6b69d-4a55-4124-b099-6c44e25aca2f', 'tecnologia@yellowkite.digital', 'Engenharia de Solucoes', '2026-02-19 15:40:31.192121+00', '2026-02-19 15:42:09.526249+00'),
  ('687e8a6e-e3b6-416f-9aea-2b1d7d094bac', 'bb5df8a8-f3c2-409d-afd9-b0603140e50e', 'admin@yellowkite.digital', NULL, '2026-02-19 16:53:47.333207+00', '2026-02-19 16:53:47.333207+00'),
  ('8b91c38e-8e2c-4121-a5bb-ebe5a7efcb6b', '95a98eed-856e-4f78-9cbd-cef529a68e41', 'admin@yellowkite.digital', NULL, '2026-02-19 16:56:27.444146+00', '2026-02-19 16:56:27.444146+00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO gestao_patrimonio.user_roles (id, user_id, role) VALUES
  ('2cb20993-10fb-446d-af2c-dc4fdd8a9ee8', 'be91b6ea-1241-4a68-98ac-df617f355482', 'admin'),
  ('c428c633-6a3c-49f2-b39f-7fb184b2892c', 'f7ab981b-5272-4373-aa12-ebf43111ac4d', 'coordinator'),
  ('c504fe09-1f67-4960-8035-758e43099f9b', '48c6b69d-4a55-4124-b099-6c44e25aca2f', 'coordinator'),
  ('cf9573ce-af5d-40f4-9f05-7108fb6add25', 'afbe83a3-b42c-4525-a682-ec3e7d4f575e', 'admin'),
  ('b7b0e84c-348f-4d54-8042-9f9b26194c22', '95a98eed-856e-4f78-9cbd-cef529a68e41', 'admin')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role;

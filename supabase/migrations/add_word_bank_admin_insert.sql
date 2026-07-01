-- Permite admins inserir novas palavras no banco (via aprovação de contestação)
create policy "admin insert word bank"
  on stop_word_bank for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

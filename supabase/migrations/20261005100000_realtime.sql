-- Grup ekranlarının canlı güncellenmesi için (RLS'e uyar: herkes sadece görebildiği satırların olayını alır)
alter publication supabase_realtime add table public.entries, public.likes, public.group_members;

-- Hesabı kalıcı olarak sil (Apple App Store şartı).
-- auth.users satırı silinince profil, kayıtlar, üyelikler, beğeniler ve push jetonları da silinir.
create function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;
revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

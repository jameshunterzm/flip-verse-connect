
drop policy "update own page" on public.creator_pages;
create policy "update own page" on public.creator_pages for update to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

drop policy "update own posts" on public.posts;
create policy "update own posts" on public.posts for update to authenticated
  using (author_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (author_id = auth.uid() or public.has_role(auth.uid(),'admin'));

revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.are_friends(uuid, uuid) from anon;
revoke execute on function public.post_visible(uuid) from anon;
revoke execute on function public.increment_post_view(uuid) from anon;
revoke execute on function public.accept_friend_request(uuid) from anon;
revoke execute on function public.remove_friend(uuid) from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.accept_friend_request(uuid) from public;
revoke execute on function public.remove_friend(uuid) from public;
grant execute on function public.accept_friend_request(uuid) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;

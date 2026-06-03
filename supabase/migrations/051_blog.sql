-- Blog: admin-authored posts shown on the public website.
-- Deploy: supabase db push

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  feature_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null default '',
  published_at timestamptz,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_posts_status_pub_idx
  on public.blog_posts (status, published_at desc);

create table if not exists public.blog_post_likes (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.blog_posts enable row level security;
alter table public.blog_post_likes enable row level security;

-- Anyone may read published posts; admins read everything.
drop policy if exists blog_read on public.blog_posts;
create policy blog_read on public.blog_posts for select
  using (status = 'published' or public.is_admin());

drop policy if exists blog_write on public.blog_posts;
create policy blog_write on public.blog_posts for all
  using (public.is_admin()) with check (public.is_admin());

-- Likes: counts are public; each user manages only their own like.
drop policy if exists blog_likes_read on public.blog_post_likes;
create policy blog_likes_read on public.blog_post_likes for select using (true);

drop policy if exists blog_likes_write on public.blog_post_likes;
create policy blog_likes_write on public.blog_post_likes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- View counter: security definer so anonymous readers can register a view on a
-- published post without write access to the table.
create or replace function public.increment_blog_views(p_slug text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.blog_posts set views = views + 1
  where slug = p_slug and status = 'published';
end;
$$;
grant execute on function public.increment_blog_views(text) to anon, authenticated;

-- Seed the two launch posts.
insert into public.blog_posts (slug, title, excerpt, body, status, author_name, published_at)
values
  (
    'what-cstf-alignment-means',
    'What CSTF alignment actually means for your Trust',
    'The Core Skills Training Framework sets out the statutory and mandatory training NHS staff need. Here is what alignment means in practice, and what it does not.',
    E'The Core Skills Training Framework (CSTF) gives NHS organisations a common standard for statutory and mandatory training. Aligning training to the framework means content maps to the agreed subjects and learning outcomes for each staff group, so completed training is portable between organisations.\n\nAlignment is not the same as accreditation, and it does not remove a Trust''s responsibility to assure competence locally. What it does provide is a shared baseline: when a member of staff moves between organisations, training mapped to the CSTF is recognised, which reduces duplication and gets people into post faster.\n\nAt Vitalcare, our mandatory courses map to the CSTF subjects by staff group, and every certificate is verifiable so your governance team can evidence completion at inspection.',
    'published',
    'Harni Muharami RN MSc',
    '2026-04-14T09:00:00Z'
  ),
  (
    'reducing-onboarding-time-in-care-homes',
    'Reducing onboarding time in care homes without cutting corners',
    'High turnover makes onboarding a constant task. Role-based learning paths get new starters safe and productive sooner, with the evidence CQC expects.',
    E'Care home managers tell us the same thing: by the time a new starter has finished their induction training, two more have joined and the cycle begins again. The instinct is to shorten training, but that creates risk and fails inspection.\n\nA better approach is to structure training into role-based learning paths. A new care assistant follows a clear sequence of statutory, mandatory and care-skills courses, with refreshers scheduled automatically before they expire. Managers see a live view of who is compliant and who is not, rather than chasing paper certificates.\n\nThe result is faster onboarding that still produces the records CQC expects, with clinical content overseen by a registered nurse.',
    'published',
    'Gideon Akinlotan',
    '2026-05-02T09:00:00Z'
  )
on conflict (slug) do nothing;

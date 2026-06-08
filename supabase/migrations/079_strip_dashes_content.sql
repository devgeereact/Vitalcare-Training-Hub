-- Remove em dashes and en dashes from already-stored content. Going forward the
-- ai-chat function strips them from every reply, but content generated before
-- that fix is already saved, so clean it once here.
--
-- Replacement: any em/en dash (with surrounding spaces) becomes ", ", then double
-- commas and stray spaces are tidied. UK house style uses commas, colons or
-- brackets instead of dashes.
-- Deploy: supabase db push

-- Blog posts
update public.blog_posts set
  title = regexp_replace(regexp_replace(title,   '\s*[—–]\s*', ', ', 'g'), ',\s*,', ',', 'g'),
  excerpt = regexp_replace(regexp_replace(excerpt, '\s*[—–]\s*', ', ', 'g'), ',\s*,', ',', 'g'),
  body = regexp_replace(regexp_replace(body,     '\s*[—–]\s*', ', ', 'g'), ',\s*,', ',', 'g')
where title ~ '[—–]' or excerpt ~ '[—–]' or body ~ '[—–]';

-- Courses
update public.courses set
  summary = regexp_replace(regexp_replace(coalesce(summary,''),     '\s*[—–]\s*', ', ', 'g'), ',\s*,', ',', 'g'),
  description = regexp_replace(regexp_replace(coalesce(description,''), '\s*[—–]\s*', ', ', 'g'), ',\s*,', ',', 'g')
where summary ~ '[—–]' or description ~ '[—–]';

-- Lessons
update public.lessons set
  content = regexp_replace(regexp_replace(coalesce(content,''), '\s*[—–]\s*', ', ', 'g'), ',\s*,', ',', 'g')
where content ~ '[—–]';

-- Announcements
update public.announcements set
  title = regexp_replace(regexp_replace(title, '\s*[—–]\s*', ', ', 'g'), ',\s*,', ',', 'g'),
  body = regexp_replace(regexp_replace(body,  '\s*[—–]\s*', ', ', 'g'), ',\s*,', ',', 'g')
where title ~ '[—–]' or body ~ '[—–]';

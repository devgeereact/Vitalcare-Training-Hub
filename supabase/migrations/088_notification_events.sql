-- Notifications for more events, each deep-linking to the specific item.
-- notification_type enum is fixed (info/enrolment/session/certificate/message/
-- announcement/system), so events reuse those values. Links open the item:
-- pages that show an item in a dialog read a ?id= param (wired app-side).
-- Deploy: supabase db push

-- Helper: notify all active admins. Inlined per trigger (no shared helper to
-- keep each function self-contained and security-definer safe).

-- 1. Course completion (enrolment progress reaches 100).
create or replace function public.notify_on_completion()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  if new.progress_pct >= 100 and coalesce(old.progress_pct, 0) < 100 then
    select title into v_title from public.courses where id = new.course_id;
    insert into public.notifications (user_id, type, title, body, link)
    values (new.learner_id, 'info', 'Course completed',
      coalesce(v_title, 'Your course') || ' is complete. Well done.',
      '/platform/courses/' || new.course_id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_completion on public.enrollments;
create trigger trg_notify_completion after update on public.enrollments
  for each row execute function public.notify_on_completion();

-- 2. New published blog post -> notify everyone.
create or replace function public.notify_on_blog_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    insert into public.notifications (user_id, type, title, body, link)
    select p.id, 'info', 'New article published', new.title,
      '/resources/blog/' || new.slug
    from public.profiles p where p.deleted_at is null;
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_blog_post on public.blog_posts;
create trigger trg_notify_blog_post after insert or update on public.blog_posts
  for each row execute function public.notify_on_blog_post();

-- 3. New session -> notify learners enrolled on its course.
create or replace function public.notify_on_session_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.course_id is not null then
    insert into public.notifications (user_id, type, title, body, link)
    select e.learner_id, 'session', 'New session scheduled', new.title,
      '/platform/sessions/' || new.id
    from public.enrollments e
    where e.course_id = new.course_id and e.deleted_at is null;
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_session_created on public.training_sessions;
create trigger trg_notify_session_created after insert on public.training_sessions
  for each row execute function public.notify_on_session_created();

-- 4. Trainer assigned to a session -> notify the trainer.
create or replace function public.notify_on_trainer_assigned()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.trainer_id is not null and new.trainer_id is distinct from old.trainer_id then
    insert into public.notifications (user_id, type, title, body, link)
    values (new.trainer_id, 'session', 'Session assigned to you', new.title,
      '/platform/sessions/' || new.id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_trainer_assigned on public.training_sessions;
create trigger trg_notify_trainer_assigned after update on public.training_sessions
  for each row execute function public.notify_on_trainer_assigned();

-- 5. New chat message -> notify the recipient.
create or replace function public.notify_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  select coalesce(nullif(full_name,''), 'Someone') into v_name
  from public.profiles where id = new.sender_id;
  insert into public.notifications (user_id, type, title, body, link)
  values (new.recipient_id, 'message', 'New message from ' || coalesce(v_name, 'Someone'),
    left(coalesce(new.body, ''), 120),
    '/platform/messages?to=' || new.sender_id);
  return new;
end; $$;
drop trigger if exists trg_notify_message on public.messages;
create trigger trg_notify_message after insert on public.messages
  for each row execute function public.notify_on_message();

-- 6. New store order -> notify admins; order paid -> notify the buyer.
create or replace function public.notify_on_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, title, body, link)
    select p.id, 'info', 'New store order',
      coalesce(new.reference, 'Order') || ' placed', '/platform/store/orders?id=' || new.id
    from public.profiles p where p.role in ('admin','super_admin') and p.deleted_at is null;
  elsif new.status = 'paid' and old.status is distinct from 'paid' and new.buyer_id is not null then
    insert into public.notifications (user_id, type, title, body, link)
    values (new.buyer_id, 'info', 'Order confirmed',
      'Your order has been confirmed.', '/platform/store/orders?id=' || new.id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_order on public.orders;
create trigger trg_notify_order after insert or update on public.orders
  for each row execute function public.notify_on_order();

-- 7. Invoice issued (sent) -> notify the recipient.
create or replace function public.notify_on_invoice()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.recipient_id is not null
     and new.status = 'sent'
     and (tg_op = 'INSERT' or old.status is distinct from 'sent') then
    insert into public.notifications (user_id, type, title, body, link)
    values (new.recipient_id, 'info', 'New invoice',
      'Invoice ' || new.number || ' is ready.', '/platform/invoices?id=' || new.id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_invoice on public.invoices;
create trigger trg_notify_invoice after insert or update on public.invoices
  for each row execute function public.notify_on_invoice();

-- 8. Payslip issued -> notify the staff member.
create or replace function public.notify_on_payroll()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (new.staff_id, 'info', 'New payslip',
    'Your payslip for ' || new.period || ' is available.', '/platform/payroll?id=' || new.id);
  return new;
end; $$;
drop trigger if exists trg_notify_payroll on public.payroll;
create trigger trg_notify_payroll after insert on public.payroll
  for each row execute function public.notify_on_payroll();

-- 9. Feedback submitted -> notify admins; feedback approved -> notify the author.
create or replace function public.notify_on_feedback()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, title, body, link)
    select p.id, 'info', 'New feedback to review',
      'A new feedback response is awaiting approval.', '/platform/feedback/results'
    from public.profiles p where p.role in ('admin','super_admin','manager') and p.deleted_at is null;
  elsif new.status = 'approved' and old.status is distinct from 'approved' and new.learner_id is not null then
    insert into public.notifications (user_id, type, title, body, link)
    values (new.learner_id, 'info', 'Your feedback is published',
      'Thank you. Your feedback has been approved.', '/platform/feedback');
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_feedback on public.feedback_responses;
create trigger trg_notify_feedback after insert or update on public.feedback_responses
  for each row execute function public.notify_on_feedback();

-- 10. Certificate notification: deep-link to the certificate preview (?id=).
create or replace function public.notify_on_certificate()
returns trigger language plpgsql security definer set search_path = public as $$
declare course_title text;
begin
  if new.approved and (tg_op = 'INSERT' or old.approved is distinct from true) then
    select title into course_title from public.courses where id = new.course_id;
    insert into public.notifications (user_id, type, title, body, link)
    values (new.learner_id, 'certificate', 'Certificate issued',
      'Your certificate for ' || coalesce(course_title, 'your course') ||
        ' is ready. Download it from your certificates.',
      '/platform/certificates?id=' || new.id);
  end if;
  return new;
end; $$;
-- trigger already exists from 083 (after insert or update); function replaced above.

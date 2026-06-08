-- Seed real curriculum (modules + lessons) for three published courses that had
-- none, so enrolled learners see content instead of "no lessons yet".
-- Matched by title and guarded: a course is only seeded when it has no modules,
-- so this is safe to re-run and will not duplicate or overwrite edited content.
-- Content is UK English, CSTF-aligned and reflects current UK guidance
-- (Resuscitation Council UK; Manual Handling Operations Regulations 1992). It is
-- training overview material; practical competence is assessed separately.
-- Deploy: supabase db push

do $$
declare
  v_course uuid;
  v_mod uuid;
begin
  -- ─────────────────────────────────────────────────────────────────────────
  -- Basic Life Support (BLS) Essentials for Healthcare Professionals
  -- ─────────────────────────────────────────────────────────────────────────
  select id into v_course from public.courses
   where lower(title) like 'basic life support (bls) essentials%'
     and deleted_at is null
   order by created_at limit 1;

  if v_course is not null
     and not exists (select 1 from public.modules where course_id = v_course and deleted_at is null) then

    insert into public.modules (course_id, title, position)
      values (v_course, 'Recognising cardiac arrest and getting help', 0) returning id into v_mod;
    insert into public.lessons (module_id, title, type, content, duration_mins, position) values
      (v_mod, 'The chain of survival', 'text',
       'Survival from cardiac arrest depends on a connected set of actions known as the chain of survival: early recognition and calling for help, early CPR, early defibrillation, and good post-resuscitation care. Each link improves the chance of a good outcome, and a delay in any one of them reduces it. As a healthcare professional you are often the first link, so knowing what to do in the first minutes matters more than any single later step.', 10, 0),
      (v_mod, 'Recognising cardiac arrest', 'text',
       'Check for danger, then check response by gently shaking the shoulders and asking loudly if the person is alright. If there is no response, open the airway and look, listen and feel for normal breathing for no more than 10 seconds. Occasional gasps (agonal breathing) are not normal breathing and are a sign of cardiac arrest. If the person is unresponsive and not breathing normally, treat it as cardiac arrest and act at once.', 10, 1),
      (v_mod, 'Calling for help', 'text',
       'Call the resuscitation team or 999 without delay and ask for a defibrillator. In a healthcare setting use your local emergency number and state the exact location. If you are alone with an adult, call first and fetch a defibrillator, then start CPR. Clear, early communication brings the right people and equipment to you while you begin compressions.', 8, 2);

    insert into public.modules (course_id, title, position)
      values (v_course, 'High-quality chest compressions', 1) returning id into v_mod;
    insert into public.lessons (module_id, title, type, content, duration_mins, position) values
      (v_mod, 'Compression depth, rate and recoil', 'text',
       'Place the heel of one hand in the centre of the chest, the other hand on top, and compress the breastbone to a depth of 5 to 6 centimetres in an adult at a rate of 100 to 120 per minute. Allow the chest to recoil fully between compressions without leaning on it, so the heart can refill. Depth, rate and full recoil together decide how well compressions move blood to the brain and heart.', 12, 0),
      (v_mod, 'Minimising interruptions', 'text',
       'Every pause in compressions lowers the pressure that keeps blood flowing, so keep interruptions as short as possible. Change the person doing compressions about every two minutes to keep quality high, and make the swap quick. Continue compressions while the defibrillator pads are attached, and stop only when prompted to let it analyse or deliver a shock.', 10, 1);

    insert into public.modules (course_id, title, position)
      values (v_course, 'Airway, rescue breaths and the AED', 2) returning id into v_mod;
    insert into public.lessons (module_id, title, type, content, duration_mins, position) values
      (v_mod, 'Airway and rescue breaths', 'text',
       'Open the airway with a head tilt and chin lift. If you are trained and willing, give two rescue breaths after every 30 compressions, watching for the chest to rise with each breath. If you are unable or unwilling to give breaths, give continuous chest compressions. Do not interrupt compressions for more than a few seconds to deliver breaths.', 10, 0),
      (v_mod, 'Safe use of an AED', 'text',
       'Turn the AED on as soon as it arrives and follow the spoken prompts. Attach the pads to the bare chest as shown on them, and make sure no one is touching the person while it analyses the rhythm or delivers a shock. After a shock, or if no shock is advised, resume compressions immediately and continue to follow the prompts until help takes over or the person recovers.', 12, 1);

    insert into public.modules (course_id, title, position)
      values (v_course, 'After resuscitation', 3) returning id into v_mod;
    insert into public.lessons (module_id, title, type, content, duration_mins, position) values
      (v_mod, 'The recovery position and handover', 'text',
       'If the person starts breathing normally, place them in the recovery position, keep checking their breathing, and be ready to restart CPR if it stops. Give a clear handover to the team that takes over, including what you found, what you did and how the person responded. Accurate, brief documentation supports the person care and your own records.', 8, 0);
  end if;

  -- ─────────────────────────────────────────────────────────────────────────
  -- Basic Life Support and First Aid
  -- ─────────────────────────────────────────────────────────────────────────
  select id into v_course from public.courses
   where title = 'Basic Life Support and First Aid' and deleted_at is null
   order by created_at limit 1;

  if v_course is not null
     and not exists (select 1 from public.modules where course_id = v_course and deleted_at is null) then

    insert into public.modules (course_id, title, position)
      values (v_course, 'The primary survey', 0) returning id into v_mod;
    insert into public.lessons (module_id, title, type, content, duration_mins, position) values
      (v_mod, 'Scene safety and DR ABC', 'text',
       'Before you help anyone, check for danger to yourself, to bystanders and to the casualty, and make the area safe. Then work through the primary survey: Danger, Response, Airway, Breathing and Circulation. This order finds and treats the things most likely to take a life first, so you deal with breathing before a minor injury.', 10, 0),
      (v_mod, 'Checking response and the airway', 'text',
       'Check response by gently shaking the shoulders and asking loudly if the person is alright. If there is no response, open the airway with a head tilt and chin lift, then look, listen and feel for normal breathing for up to 10 seconds. If breathing is absent or not normal, call 999, ask for a defibrillator and start CPR.', 10, 1);

    insert into public.modules (course_id, title, position)
      values (v_course, 'CPR and defibrillation', 1) returning id into v_mod;
    insert into public.lessons (module_id, title, type, content, duration_mins, position) values
      (v_mod, 'Adult CPR', 'text',
       'Give 30 chest compressions in the centre of the chest, 5 to 6 centimetres deep at 100 to 120 per minute, allowing full recoil each time, followed by 2 rescue breaths if you are trained and willing. Continue at a ratio of 30 to 2. If you cannot give breaths, give continuous compressions. Keep going until help arrives or the person recovers.', 12, 0),
      (v_mod, 'Using an AED', 'text',
       'Switch the AED on and follow its prompts. Attach the pads to the bare chest, keep everyone clear while it analyses and shocks, and resume compressions straight away afterwards. Early defibrillation, within the first few minutes, is one of the strongest factors in survival.', 10, 1);

    insert into public.modules (course_id, title, position)
      values (v_course, 'Common emergencies', 2) returning id into v_mod;
    insert into public.lessons (module_id, title, type, content, duration_mins, position) values
      (v_mod, 'Choking', 'text',
       'If the person can cough, encourage them to keep coughing. If the obstruction is severe and they cannot cough, speak or breathe, give up to 5 back blows between the shoulder blades, then up to 5 abdominal thrusts, alternating until the obstruction clears or the person becomes unresponsive. If they become unresponsive, start CPR and call 999.', 10, 0),
      (v_mod, 'Severe bleeding and shock', 'text',
       'Control severe bleeding with firm, direct pressure on the wound and call 999. Lay the person down, raise the legs if you can, and keep them warm, as these are signs the body may be going into shock. Do not give food or drink. Keep checking response and breathing while you wait for the ambulance.', 10, 1),
      (v_mod, 'The recovery position', 'text',
       'A person who is unresponsive but breathing normally should be placed in the recovery position to keep the airway open and clear. Stay with them, keep checking that breathing remains normal, and be ready to start CPR if it stops. Call 999 if you have not already.', 8, 2);
  end if;

  -- ─────────────────────────────────────────────────────────────────────────
  -- Moving and Handling People
  -- ─────────────────────────────────────────────────────────────────────────
  select id into v_course from public.courses
   where title = 'Moving and Handling People' and deleted_at is null
   order by created_at limit 1;

  if v_course is not null
     and not exists (select 1 from public.modules where course_id = v_course and deleted_at is null) then

    insert into public.modules (course_id, title, position)
      values (v_course, 'Law and responsibilities', 0) returning id into v_mod;
    insert into public.lessons (module_id, title, type, content, duration_mins, position) values
      (v_mod, 'The legal framework', 'text',
       'Moving and handling in care is governed mainly by the Manual Handling Operations Regulations 1992 and the Health and Safety at Work Act 1974. Employers must avoid hazardous manual handling where reasonably practicable, assess what cannot be avoided, and reduce the risk. Staff must follow safe systems of work, use the equipment provided, and report concerns. Safe handling protects both the person being moved and the worker.', 10, 0),
      (v_mod, 'Shared responsibility', 'text',
       'Your employer provides equipment, training and risk assessments. You are responsible for using that training, working within your competence, and raising problems such as faulty equipment or a change in a person needs. Good moving and handling is a shared duty, not the job of one person alone.', 8, 1);

    insert into public.modules (course_id, title, position)
      values (v_course, 'Protecting your back', 1) returning id into v_mod;
    insert into public.lessons (module_id, title, type, content, duration_mins, position) values
      (v_mod, 'The spine and injury', 'text',
       'The spine is strong but vulnerable to injury from repeated poor technique, twisting and overloading. Most handling injuries build up over time rather than from a single event. Keeping the natural curves of the spine, working within a stable base and avoiding twisting are the foundations of protecting your back across a whole career.', 10, 0),
      (v_mod, 'Principles of safe movement', 'text',
       'Keep the load close, maintain a stable position with feet apart, bend at the hips and knees rather than the back, and move smoothly without jerking or twisting. Lead with the head, keep the back in its natural line, and never lift more than you can manage safely. When in doubt, stop and reassess.', 10, 1);

    insert into public.modules (course_id, title, position)
      values (v_course, 'Risk assessment and equipment', 2) returning id into v_mod;
    insert into public.lessons (module_id, title, type, content, duration_mins, position) values
      (v_mod, 'Assessing the move (TILE)', 'text',
       'Assess every move using TILE: the Task, the Individual doing the handling, the Load or person being moved, and the Environment. Consider the person ability to help, their weight and any pain, the space and floor surface, and whether equipment is needed. A quick, honest assessment before you start prevents most injuries.', 10, 0),
      (v_mod, 'Using equipment safely', 'text',
       'Hoists, slide sheets, transfer boards and handling belts reduce the load on staff and make moves safer and more dignified for the person. Use only equipment you have been trained on, check it is serviced and undamaged before use, and select the right size and accessories. Where a hoist is needed, manual lifting of a person should be avoided.', 10, 1),
      (v_mod, 'Person-centred handling and falls', 'text',
       'Involve the person in every move, explain what will happen, and support what they can do for themselves to keep their dignity and independence. If a person starts to fall, do not try to catch their full weight: guide them to the floor in a controlled way, protecting their head, and get help. Record and report the event afterwards.', 10, 2);
  end if;
end $$;

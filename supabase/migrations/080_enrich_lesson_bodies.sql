-- Fuller lesson bodies for the three seeded courses: each lesson gains a lead
-- paragraph, a "Key points" list and an application note, as HTML so it renders
-- as structured prose and makes a richer downloadable handout. UK English, no em
-- or en dashes. Matched by course + module + lesson title, so it upgrades content
-- whether migration 078 ran as the basic seed or not. Idempotent.
-- Deploy: supabase db push

do $$
declare
  v_course uuid;
begin
  -- Helper inline updates keyed by (module title, lesson title) within a course.
  -- BLS Essentials -----------------------------------------------------------
  select id into v_course from public.courses
   where lower(title) like 'basic life support (bls) essentials%' and deleted_at is null
   order by created_at limit 1;
  if v_course is not null then
    update public.lessons set content =
      '<p>Survival from cardiac arrest depends on a connected set of actions known as the chain of survival. The links are early recognition and a call for help, early CPR, early defibrillation, and good post-resuscitation care. A delay in any one link reduces the chance of a good outcome.</p>'
      '<p><strong>Key points</strong></p><ul><li>Each link depends on the one before it.</li><li>As a healthcare professional you are often the first link.</li><li>The first minutes matter more than any later step.</li></ul>'
      '<p>In practice, act on what you can control immediately: recognise the arrest, call for help, and start compressions.</p>'
      where title = 'The chain of survival' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Check for danger, then check response by gently shaking the shoulders and asking loudly if the person is alright. If there is no response, open the airway and look, listen and feel for normal breathing for no more than 10 seconds.</p>'
      '<p><strong>Key points</strong></p><ul><li>Occasional gasps (agonal breathing) are not normal breathing.</li><li>Unresponsive and not breathing normally means cardiac arrest.</li><li>Do not delay to confirm a pulse if you are not confident.</li></ul>'
      '<p>If in doubt, treat it as cardiac arrest and start CPR. Acting early does more good than waiting.</p>'
      where title = 'Recognising cardiac arrest' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Call the resuscitation team or 999 without delay and ask for a defibrillator. In a healthcare setting use your local emergency number and state the exact location.</p>'
      '<p><strong>Key points</strong></p><ul><li>If alone with an adult, call first, then start CPR.</li><li>State your exact location clearly.</li><li>Send someone for the nearest defibrillator.</li></ul>'
      '<p>Clear, early communication brings the right people and equipment while you begin compressions.</p>'
      where title = 'Calling for help' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Place the heel of one hand in the centre of the chest, the other hand on top, and compress the breastbone 5 to 6 centimetres deep in an adult at 100 to 120 per minute. Allow the chest to recoil fully between compressions.</p>'
      '<p><strong>Key points</strong></p><ul><li>Depth: 5 to 6 centimetres for an adult.</li><li>Rate: 100 to 120 per minute.</li><li>Full recoil lets the heart refill.</li></ul>'
      '<p>Depth, rate and full recoil together decide how well compressions move blood to the brain and heart.</p>'
      where title = 'Compression depth, rate and recoil' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Every pause in compressions lowers the pressure that keeps blood flowing, so keep interruptions as short as possible. Change the person doing compressions about every two minutes to keep quality high.</p>'
      '<p><strong>Key points</strong></p><ul><li>Minimise hands-off time.</li><li>Swap compressors roughly every two minutes.</li><li>Continue compressions while pads are attached.</li></ul>'
      '<p>Stop only when prompted to let the defibrillator analyse or deliver a shock.</p>'
      where title = 'Minimising interruptions' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Open the airway with a head tilt and chin lift. If you are trained and willing, give two rescue breaths after every 30 compressions, watching for the chest to rise with each breath.</p>'
      '<p><strong>Key points</strong></p><ul><li>Ratio: 30 compressions to 2 breaths.</li><li>Each breath should make the chest rise.</li><li>If unable or unwilling to give breaths, give continuous compressions.</li></ul>'
      '<p>Do not interrupt compressions for more than a few seconds to deliver breaths.</p>'
      where title = 'Airway and rescue breaths' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Turn the AED on as soon as it arrives and follow the spoken prompts. Attach the pads to the bare chest as shown on them, and make sure no one is touching the person while it analyses the rhythm or delivers a shock.</p>'
      '<p><strong>Key points</strong></p><ul><li>Switch it on first and follow the prompts.</li><li>Stand clear during analysis and shock.</li><li>Resume compressions immediately after a shock or a no-shock advice.</li></ul>'
      '<p>Continue to follow the prompts until help takes over or the person recovers.</p>'
      where title = 'Safe use of an AED' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>If the person starts breathing normally, place them in the recovery position, keep checking their breathing, and be ready to restart CPR if it stops.</p>'
      '<p><strong>Key points</strong></p><ul><li>Recovery position keeps the airway open and clear.</li><li>Keep watching that breathing stays normal.</li><li>Give a clear handover of what you found, did and saw.</li></ul>'
      '<p>Accurate, brief documentation supports the person care and your own records.</p>'
      where title = 'The recovery position and handover' and module_id in (select id from public.modules where course_id = v_course);
  end if;

  -- BLS and First Aid --------------------------------------------------------
  select id into v_course from public.courses
   where title = 'Basic Life Support and First Aid' and deleted_at is null
   order by created_at limit 1;
  if v_course is not null then
    update public.lessons set content =
      '<p>Before you help anyone, check for danger to yourself, to bystanders and to the casualty, and make the area safe. Then work through the primary survey: Danger, Response, Airway, Breathing and Circulation.</p>'
      '<p><strong>Key points</strong></p><ul><li>Your safety comes first.</li><li>DR ABC sets the order of priorities.</li><li>Deal with breathing before a minor injury.</li></ul>'
      '<p>This order finds and treats the things most likely to take a life first.</p>'
      where title = 'Scene safety and DR ABC' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Check response by gently shaking the shoulders and asking loudly if the person is alright. If there is no response, open the airway with a head tilt and chin lift, then look, listen and feel for normal breathing for up to 10 seconds.</p>'
      '<p><strong>Key points</strong></p><ul><li>No response: open the airway.</li><li>Check breathing for up to 10 seconds.</li><li>Absent or abnormal breathing: call 999 and start CPR.</li></ul>'
      '<p>Ask for a defibrillator as soon as you suspect cardiac arrest.</p>'
      where title = 'Checking response and the airway' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Give 30 chest compressions in the centre of the chest, 5 to 6 centimetres deep at 100 to 120 per minute, allowing full recoil each time, followed by 2 rescue breaths if you are trained and willing.</p>'
      '<p><strong>Key points</strong></p><ul><li>Ratio: 30 to 2.</li><li>Push hard and fast, allow full recoil.</li><li>If you cannot give breaths, give continuous compressions.</li></ul>'
      '<p>Keep going until help arrives or the person recovers.</p>'
      where title = 'Adult CPR' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Switch the AED on and follow its prompts. Attach the pads to the bare chest, keep everyone clear while it analyses and shocks, and resume compressions straight away afterwards.</p>'
      '<p><strong>Key points</strong></p><ul><li>Early defibrillation strongly improves survival.</li><li>Stand clear during analysis and shock.</li><li>Resume CPR immediately after.</li></ul>'
      '<p>Defibrillation within the first few minutes is one of the strongest factors in survival.</p>'
      where title = 'Using an AED' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>If the person can cough, encourage them to keep coughing. If the obstruction is severe and they cannot cough, speak or breathe, give up to 5 back blows between the shoulder blades, then up to 5 abdominal thrusts.</p>'
      '<p><strong>Key points</strong></p><ul><li>Effective cough: encourage coughing.</li><li>Severe: 5 back blows, then 5 abdominal thrusts, alternating.</li><li>If they become unresponsive, start CPR and call 999.</li></ul>'
      '<p>Reassess after each cycle until the obstruction clears.</p>'
      where title = 'Choking' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Control severe bleeding with firm, direct pressure on the wound and call 999. Lay the person down, raise the legs if you can, and keep them warm.</p>'
      '<p><strong>Key points</strong></p><ul><li>Direct pressure controls most bleeding.</li><li>Lie down, raise legs, keep warm for shock.</li><li>Do not give food or drink.</li></ul>'
      '<p>Keep checking response and breathing while you wait for the ambulance.</p>'
      where title = 'Severe bleeding and shock' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>A person who is unresponsive but breathing normally should be placed in the recovery position to keep the airway open and clear.</p>'
      '<p><strong>Key points</strong></p><ul><li>Use it for unresponsive but breathing normally.</li><li>Stay with the person and keep watching breathing.</li><li>Be ready to start CPR if breathing stops.</li></ul>'
      '<p>Call 999 if you have not already.</p>'
      where title = 'The recovery position' and module_id in (select id from public.modules where course_id = v_course);
  end if;

  -- Moving and Handling People ----------------------------------------------
  select id into v_course from public.courses
   where title = 'Moving and Handling People' and deleted_at is null
   order by created_at limit 1;
  if v_course is not null then
    update public.lessons set content =
      '<p>Moving and handling in care is governed mainly by the Manual Handling Operations Regulations 1992 and the Health and Safety at Work Act 1974. Employers must avoid hazardous manual handling where reasonably practicable, assess what cannot be avoided, and reduce the risk.</p>'
      '<p><strong>Key points</strong></p><ul><li>Avoid, assess, reduce is the legal approach.</li><li>Staff must follow safe systems of work.</li><li>Report faulty equipment and new risks.</li></ul>'
      '<p>Safe handling protects both the person being moved and the worker.</p>'
      where title = 'The legal framework' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Your employer provides equipment, training and risk assessments. You are responsible for using that training, working within your competence, and raising problems such as faulty equipment or a change in a person needs.</p>'
      '<p><strong>Key points</strong></p><ul><li>Employer: equipment, training, assessment.</li><li>You: use training, work within competence.</li><li>Raise problems early.</li></ul>'
      '<p>Good moving and handling is a shared duty, not the job of one person alone.</p>'
      where title = 'Shared responsibility' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>The spine is strong but vulnerable to injury from repeated poor technique, twisting and overloading. Most handling injuries build up over time rather than from a single event.</p>'
      '<p><strong>Key points</strong></p><ul><li>Injuries usually build up gradually.</li><li>Keep the natural curves of the spine.</li><li>Avoid twisting under load.</li></ul>'
      '<p>Protecting your back is a habit that lasts a whole career.</p>'
      where title = 'The spine and injury' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Keep the load close, maintain a stable position with feet apart, bend at the hips and knees rather than the back, and move smoothly without jerking or twisting.</p>'
      '<p><strong>Key points</strong></p><ul><li>Load close, stable base, bend hips and knees.</li><li>Lead with the head, keep the back in line.</li><li>Move smoothly, never jerk or twist.</li></ul>'
      '<p>Never lift more than you can manage safely. When in doubt, stop and reassess.</p>'
      where title = 'Principles of safe movement' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Assess every move using TILE: the Task, the Individual doing the handling, the Load or person being moved, and the Environment.</p>'
      '<p><strong>Key points</strong></p><ul><li>Task: what is being done and how often.</li><li>Individual and Load: capability, weight, pain.</li><li>Environment: space, floor, obstacles.</li></ul>'
      '<p>A quick, honest assessment before you start prevents most injuries.</p>'
      where title = 'Assessing the move (TILE)' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Hoists, slide sheets, transfer boards and handling belts reduce the load on staff and make moves safer and more dignified for the person. Use only equipment you have been trained on.</p>'
      '<p><strong>Key points</strong></p><ul><li>Use only equipment you are trained on.</li><li>Check it is serviced and undamaged first.</li><li>Where a hoist is needed, avoid manual lifting of a person.</li></ul>'
      '<p>Select the right size and accessories for the person and the task.</p>'
      where title = 'Using equipment safely' and module_id in (select id from public.modules where course_id = v_course);

    update public.lessons set content =
      '<p>Involve the person in every move, explain what will happen, and support what they can do for themselves to keep their dignity and independence.</p>'
      '<p><strong>Key points</strong></p><ul><li>Explain and involve the person.</li><li>If they start to fall, guide them down, do not catch full weight.</li><li>Protect the head and get help.</li></ul>'
      '<p>Record and report any fall or near miss afterwards.</p>'
      where title = 'Person-centred handling and falls' and module_id in (select id from public.modules where course_id = v_course);
  end if;
end $$;

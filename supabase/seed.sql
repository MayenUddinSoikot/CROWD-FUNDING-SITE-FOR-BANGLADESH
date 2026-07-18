-- ============================================================
-- Shohay sample data — Day 3 (part 2)
-- Paste into Supabase → SQL Editor → Run, AFTER schema.sql.
-- Two example campaigns + a few example donations so the
-- website has something real to show while we build Days 4-6.
-- We will delete these before launch.
-- ============================================================

insert into public.campaigns
  (slug, title, title_bn, summary, summary_bn, story, category,
   goal_amount, status, beneficiary_name, district, approved_at, cover_image_url)
values
  (
    'sample-heart-surgery',
    'Help Rahim Get Heart Surgery',
    'রহিমের হার্ট সার্জারিতে সাহায্য করুন',
    'Rahim, a 45-year-old rickshaw driver from Jashore, needs urgent bypass surgery his family cannot afford.',
    'যশোরের ৪৫ বছর বয়সী রিকশাচালক রহিমের জরুরি বাইপাস সার্জারি প্রয়োজন, যার খরচ তার পরিবারের সাধ্যের বাইরে।',
    'This is a sample campaign used while building the website. It will be removed before launch.',
    'medical',
    350000, 'approved', 'Md. Rahim Uddin', 'Jashore', now(), null
  ),
  (
    'sample-flood-relief',
    'Emergency Flood Relief for Sylhet Families',
    'সিলেটের পরিবারগুলোর জন্য জরুরি বন্যা ত্রাণ',
    'Food, clean water, and dry clothes for 200 families displaced by flooding in Sylhet.',
    'সিলেটে বন্যায় ক্ষতিগ্রস্ত ২০০ পরিবারের জন্য খাবার, বিশুদ্ধ পানি ও শুকনো কাপড়।',
    'This is a sample campaign used while building the website. It will be removed before launch.',
    'disaster_relief',
    500000, 'approved', 'Sylhet Relief Committee', 'Sylhet', now(), null
  );

insert into public.donations
  (campaign_id, donor_name, amount, status, is_anonymous, message, tran_id, paid_at)
values
  ((select id from public.campaigns where slug = 'sample-heart-surgery'),
   'Fatema Khatun', 5000, 'paid', false, 'Get well soon, brother.', 'SEED-001', now() - interval '2 days'),
  ((select id from public.campaigns where slug = 'sample-heart-surgery'),
   'Anonymous Donor', 25000, 'paid', true, null, 'SEED-002', now() - interval '1 day'),
  ((select id from public.campaigns where slug = 'sample-heart-surgery'),
   'Tanvir Ahmed', 1000, 'paid', false, 'দোয়া রইল', 'SEED-003', now() - interval '3 hours'),
  ((select id from public.campaigns where slug = 'sample-flood-relief'),
   'Nusrat Jahan', 10000, 'paid', false, 'Stay strong, Sylhet!', 'SEED-004', now() - interval '5 hours');

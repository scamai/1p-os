-- seed_launch.sql
-- Seed data for FounderLaunch feature (migration 010_founder_launch.sql)
-- Tables: launch_phases, launch_templates, launch_steps, accelerator_programs

BEGIN;

-- ============================================================
-- 1. launch_phases (7 phases)
-- ============================================================
INSERT INTO launch_phases (slug, title, description, estimated_minutes, sort_order, is_conditional, condition_field) VALUES
  ('about-you',     'Tell us about you',            'Quick questions to personalize your plan',                 15, 1, false, null),
  ('incorporate',   'Incorporate your company',      'File your Delaware C-Corp and get legal foundations',      30, 2, false, null),
  ('operations',    'Set up operations',             'Bank account, legal templates, compliance',                45, 3, false, null),
  ('cap-table',     'Cap table & equity',            'Share allocation, vesting, option pool',                   30, 4, false, null),
  ('pitch-deck',    'Build your pitch deck',         'Tell your story in 12 slides',                            60, 5, true,  'planning_to_raise'),
  ('fundraise',     'Fundraise preparation',         'SAFEs, investor outreach, data room',                     45, 6, true,  'planning_to_raise'),
  ('accelerators',  'Accelerator applications',      'Find and apply to the right programs',                    45, 7, true,  'planning_to_raise');

-- ============================================================
-- 2. launch_templates (14 templates — inserted before steps)
-- ============================================================
INSERT INTO launch_templates (slug, title, description, category, file_type, is_fillable, fill_fields, contributor, license) VALUES
  (
    'board-consent',
    'Initial Board Consent',
    'Board resolution appointing officers and authorizing stock',
    'legal', 'pdf', true,
    '{"company_name": "founder_profiles.company_name", "founder_name": "users.full_name", "date": "NOW", "total_shares": "10000000"}'::jsonb,
    'FounderLaunch', 'MIT'
  ),
  (
    'stock-purchase',
    'Stock Purchase Agreement',
    'Founder stock purchase at par value',
    'legal', 'pdf', true,
    '{"company_name": "founder_profiles.company_name", "founder_name": "users.full_name", "share_price": "0.0001", "total_shares": "10000000"}'::jsonb,
    'FounderLaunch', 'MIT'
  ),
  (
    '83b-election',
    '83(b) Election Letter',
    'IRS election to be taxed on grant date',
    'legal', 'pdf', true,
    '{"company_name": "founder_profiles.company_name", "founder_name": "users.full_name", "share_price": "0.0001"}'::jsonb,
    'FounderLaunch', 'MIT'
  ),
  (
    'ip-assignment',
    'IP Assignment Agreement',
    'Assigns pre-existing IP to the company',
    'legal', 'pdf', true,
    '{"company_name": "founder_profiles.company_name", "founder_name": "users.full_name"}'::jsonb,
    'FounderLaunch', 'MIT'
  ),
  (
    'ciia',
    'CIIA Template',
    'Confidential Information and Inventions Assignment',
    'legal', 'pdf', true,
    '{"company_name": "founder_profiles.company_name"}'::jsonb,
    'FounderLaunch', 'MIT'
  ),
  (
    'nda',
    'Mutual NDA',
    'Non-disclosure agreement for partners and vendors',
    'legal', 'pdf', true,
    '{"company_name": "founder_profiles.company_name"}'::jsonb,
    'FounderLaunch', 'MIT'
  ),
  (
    'contractor-agreement',
    'Contractor Agreement',
    'Independent contractor agreement template',
    'legal', 'pdf', true,
    '{"company_name": "founder_profiles.company_name"}'::jsonb,
    'FounderLaunch', 'MIT'
  ),
  (
    'cofounder-agreement',
    'Co-founder Agreement',
    'Roles, equity, vesting, IP, departure terms',
    'legal', 'pdf', true,
    '{"company_name": "founder_profiles.company_name"}'::jsonb,
    'FounderLaunch', 'MIT'
  ),
  (
    'cap-table-sheet',
    'Cap Table Spreadsheet',
    'Google Sheets cap table template',
    'financial', 'google_sheets', false,
    null,
    'FounderLaunch', 'MIT'
  ),
  (
    'pitch-deck-template',
    'Pitch Deck Template',
    '12-slide pitch deck with structure',
    'fundraise', 'google_slides', true,
    '{"company_name": "founder_profiles.company_name", "idea_description": "founder_profiles.idea_description"}'::jsonb,
    'FounderLaunch', 'MIT'
  ),
  (
    'cold-email-templates',
    'Investor Cold Email Templates',
    '3 email templates for investor outreach',
    'fundraise', 'markdown', true,
    '{"company_name": "founder_profiles.company_name", "founder_name": "users.full_name"}'::jsonb,
    'FounderLaunch', 'MIT'
  ),
  (
    'warm-intro-template',
    'Warm Intro Request Template',
    'Template for asking your network for intros',
    'fundraise', 'markdown', true,
    '{"company_name": "founder_profiles.company_name"}'::jsonb,
    'FounderLaunch', 'MIT'
  ),
  (
    'data-room-structure',
    'Data Room Structure',
    'Google Drive folder structure for fundraising',
    'fundraise', 'markdown', false,
    null,
    'FounderLaunch', 'MIT'
  ),
  (
    'investor-crm-sheet',
    'Investor CRM Spreadsheet',
    'Track investor pipeline in Google Sheets',
    'fundraise', 'google_sheets', false,
    null,
    'FounderLaunch', 'MIT'
  );

-- ============================================================
-- 3. launch_steps
-- ============================================================

-- -------------------------------------------------------
-- Phase 1: about-you (6 steps)
-- -------------------------------------------------------
INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order) VALUES
  ((SELECT id FROM launch_phases WHERE slug = 'about-you'), 'solo-or-cofounder',  'Solo or co-founder?',              'form', 2, 1),
  ((SELECT id FROM launch_phases WHERE slug = 'about-you'), 'what-building',       'What are you building?',            'form', 3, 2),
  ((SELECT id FROM launch_phases WHERE slug = 'about-you'), 'planning-to-raise',   'Planning to raise VC?',             'form', 1, 3),
  ((SELECT id FROM launch_phases WHERE slug = 'about-you'), 'where-you-live',      'Where do you live?',                'form', 1, 4);

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'about-you'),
    'incorporation-path',
    'Choose your incorporation path',
    'form', 3, 5,
    E'Three options:\n\n**DIY ($89)** \u2014 File directly with Delaware. We walk you through every click.\n\n**Budget ($100-150)** \u2014 Use Northwest Registered Agent. They handle paperwork.\n\n**Stripe Atlas ($500)** \u2014 All-in-one. Bank account + legal docs included.'
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'about-you'),
    'your-plan',
    'Your personalized plan',
    'info', 2, 6,
    'Based on your answers, here is your customized launch checklist.'
  );

-- -------------------------------------------------------
-- Phase 2: incorporate (6 steps)
-- -------------------------------------------------------
INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, external_url, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'incorporate'),
    'check-name',
    'Check company name availability',
    'action', 5, 1,
    'https://icis.corp.delaware.gov/ecorp/entitysearch/namesearch.aspx',
    'Search for your company name on the Delaware Division of Corporations website. Also check domain availability.'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, trap_warning, trap_severity) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'incorporate'),
    'file-incorporation',
    'File your Certificate of Incorporation',
    'action', 10, 2,
    'If you chose C-Corp, make sure you are filing a Certificate of Incorporation, NOT an LLC formation. LLCs cannot take VC investment.',
    'critical'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, external_url, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'incorporate'),
    'apply-ein',
    'Apply for EIN',
    'action', 10, 3,
    'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online',
    'Apply for your Employer Identification Number (EIN) on the IRS website. It is free and takes about 10 minutes. You will receive your EIN immediately.'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, template_id) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'incorporate'),
    'board-consent',
    'Initial board consent',
    'template', 5, 4,
    (SELECT id FROM launch_templates WHERE slug = 'board-consent')
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'incorporate'),
    'stock-purchase',
    'Stock purchase agreement',
    'template', 5, 5,
    (SELECT id FROM launch_templates WHERE slug = 'stock-purchase')
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, template_id, trap_warning, trap_severity) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'incorporate'),
    '83b-election',
    '83(b) election',
    'template', 10, 6,
    (SELECT id FROM launch_templates WHERE slug = '83b-election'),
    'YOU MUST mail this to the IRS within 30 days of your stock purchase. Missing this deadline can cost you tens of thousands in taxes. There is NO extension.',
    'critical'
  );

-- -------------------------------------------------------
-- Phase 3: operations (8 steps)
-- -------------------------------------------------------
INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'operations'),
    'bank-account',
    'Open a startup bank account',
    'info', 10, 1,
    E'**Mercury** (recommended for startups) \u2014 Free, instant setup, integrations with accounting tools.\n\n**Brex** \u2014 Good for teams that need corporate cards.\n\nBoth are free. Open one today.'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, template_id, trap_warning, trap_severity) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'operations'),
    'ip-assignment',
    'IP assignment agreement',
    'template', 5, 2,
    (SELECT id FROM launch_templates WHERE slug = 'ip-assignment'),
    'Without this, any code, designs, or inventions you created BEFORE incorporating technically do not belong to the company.',
    'warning'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, template_id) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'operations'),
    'ciia-template',
    'CIIA template',
    'template', 5, 3,
    (SELECT id FROM launch_templates WHERE slug = 'ciia')
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'operations'),
    'nda-template',
    'NDA template',
    'template', 5, 4,
    (SELECT id FROM launch_templates WHERE slug = 'nda')
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, template_id, trap_warning, trap_severity) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'operations'),
    'contractor-agreement',
    'Contractor agreement template',
    'template', 5, 5,
    (SELECT id FROM launch_templates WHERE slug = 'contractor-agreement'),
    'Any contractor who builds your product without signing this could claim ownership of what they built.',
    'warning'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'operations'),
    'bookkeeping-setup',
    'Set up bookkeeping',
    'info', 5, 6,
    E'**Wave** (free) \u2014 Best free option for early startups.\n\n**Akaunting** (free, self-hosted) \u2014 Open source, you control the data.\n\n**QuickBooks** ($30/mo) \u2014 Industry standard, best integrations.'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, is_conditional, condition_json, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'operations'),
    'state-registration',
    'State registration check',
    'info', 5, 7,
    true,
    '{"home_state": {"$ne": "DE"}}'::jsonb,
    'You are incorporated in Delaware but operating in another state. You likely need to foreign-qualify in your home state.'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'operations'),
    'compliance-calendar',
    'Compliance calendar setup',
    'action', 5, 8,
    E'We will set up automatic reminders for:\n\n- Delaware franchise tax (March 1, annually)\n- Delaware annual report (March 1, annually)\n- Federal tax return\n- State tax obligations'
  );

-- -------------------------------------------------------
-- Phase 4: cap-table (6 steps)
-- -------------------------------------------------------
INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'cap-table'),
    'share-allocation',
    'Founder share allocation',
    'calculator', 5, 1,
    E'Default: 10,000,000 authorized shares at $0.0001/share.\n\n**Authorized** = total shares the company can issue.\n**Issued** = shares actually given out.\n**Outstanding** = issued shares not returned.'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, is_conditional, condition_json, trap_warning, trap_severity) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'cap-table'),
    'equity-split',
    'Co-founder equity split',
    'calculator', 10, 2,
    true,
    '{"is_solo": false}'::jsonb,
    'Never do a 50/50 split without vesting. If your co-founder leaves after 3 months, they keep 50% of the company forever.',
    'critical'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'cap-table'),
    'vesting-schedule',
    'Vesting schedule builder',
    'calculator', 5, 3,
    'Standard: 4-year vesting with 1-year cliff, monthly thereafter.'
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'cap-table'),
    'option-pool',
    'Option pool planning',
    'calculator', 5, 4,
    'An option pool reserves shares for future employees. Typical size is 10-20% of total shares.'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, is_conditional, condition_json, template_id) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'cap-table'),
    'cofounder-agreement',
    'Co-founder agreement',
    'template', 10, 5,
    true,
    '{"is_solo": false}'::jsonb,
    (SELECT id FROM launch_templates WHERE slug = 'cofounder-agreement')
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'cap-table'),
    'cap-table-setup',
    'Cap table setup',
    'action', 10, 6,
    E'**Option A: Google Sheets** (free) \u2014 Download our cap table template.\n\n**Option B: Carta Launch** (free tier) \u2014 Professional cap table management.'
  );

-- -------------------------------------------------------
-- Phase 5: pitch-deck (8 steps)
-- -------------------------------------------------------
INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'pitch-deck'),
    'storytelling-framework',
    'Storytelling framework',
    'info', 10, 1,
    E'**The narrative arc:**\n\nStatus quo \u2192 Problem \u2192 Failed solutions \u2192 Your insight \u2192 Solution \u2192 Proof \u2192 Vision \u2192 Ask\n\nEvery great pitch follows this structure.'
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'pitch-deck'),
    'title-problem',
    'Title + Problem slides',
    'form', 10, 2,
    'What is the painful problem? Who feels it? How do they cope today?'
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'pitch-deck'),
    'solution-how',
    'Solution + How it works',
    'form', 10, 3,
    'What is your solution in one sentence? Show, do not tell — screenshot or demo.'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'pitch-deck'),
    'market-why-now',
    'Market size + Why now',
    'calculator', 10, 4
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'pitch-deck'),
    'traction-model',
    'Traction + Business model',
    'form', 5, 5,
    'Any users, revenue, waitlist, LOIs? How do you make money?'
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'pitch-deck'),
    'team-competition',
    'Team + Competition',
    'form', 5, 6,
    'Why is YOUR team the one to build this? What is your unfair advantage?'
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'pitch-deck'),
    'ask-funds',
    'Ask + Use of funds',
    'form', 5, 7,
    'How much are you raising? What milestones will it fund?'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, template_id) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'pitch-deck'),
    'download-deck',
    'Download your deck',
    'action', 5, 8,
    (SELECT id FROM launch_templates WHERE slug = 'pitch-deck-template')
  );

-- -------------------------------------------------------
-- Phase 6: fundraise (7 steps)
-- -------------------------------------------------------
INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'fundraise'),
    'safe-explained',
    'SAFE notes explained',
    'info', 10, 1,
    E'A SAFE (Simple Agreement for Future Equity) is the standard instrument for pre-seed and seed fundraising. Created by Y Combinator.\n\nKey terms:\n- **Valuation cap**: Maximum valuation at which your SAFE converts to equity\n- **Discount**: Percentage discount on the Series A price\n- **MFN**: Most Favored Nation clause\n- **Pro-rata rights**: Right to maintain ownership percentage in future rounds'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'fundraise'),
    'valuation-calculator',
    'Valuation cap calculator',
    'calculator', 10, 2
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'fundraise'),
    'investor-list',
    'Build your investor list',
    'action', 15, 3,
    'Search our investor database filtered by stage, sector, and check size. Add investors to your personal tracker.'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, template_id) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'fundraise'),
    'cold-email',
    'Cold email templates',
    'template', 5, 4,
    (SELECT id FROM launch_templates WHERE slug = 'cold-email-templates')
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'fundraise'),
    'warm-intro',
    'Warm intro request template',
    'template', 5, 5,
    (SELECT id FROM launch_templates WHERE slug = 'warm-intro-template')
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'fundraise'),
    'data-room',
    'Data room setup',
    'template', 10, 6,
    (SELECT id FROM launch_templates WHERE slug = 'data-room-structure')
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'fundraise'),
    'investor-crm',
    'Investor CRM setup',
    'template', 5, 7,
    (SELECT id FROM launch_templates WHERE slug = 'investor-crm-sheet')
  );

-- -------------------------------------------------------
-- Phase 7: accelerators (5 steps)
-- -------------------------------------------------------
INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'accelerators'),
    'accelerator-match',
    'Accelerator match quiz',
    'calculator', 5, 1
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order, content_md) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'accelerators'),
    'yc-guide',
    'YC application guide',
    'info', 15, 2,
    'Question-by-question coaching for every field of the Y Combinator application.'
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'accelerators'),
    'video-script',
    '1-minute video script',
    'form', 10, 3,
    '"[Name], [Company]. We are building [one-line]. [Problem] affects [who]. [Solution] works by [how]. We have [traction]. [Ask]."'
  ),
  (
    (SELECT id FROM launch_phases WHERE slug = 'accelerators'),
    'other-accelerators',
    'Other accelerator apps',
    'info', 10, 4,
    E'**Techstars**: More structured mentorship, 3-month program. Takes 6-10%.\n\n**500 Global**: Larger cohorts, global network. Takes 6%.\n\n**Precursor**: Pre-seed focused, founder-friendly terms.'
  );

INSERT INTO launch_steps (phase_id, slug, title, step_type, estimated_minutes, sort_order) VALUES
  (
    (SELECT id FROM launch_phases WHERE slug = 'accelerators'),
    'application-tracker',
    'Application tracker',
    'action', 5, 5
  );

-- ============================================================
-- 4. accelerator_programs (5 programs)
-- ============================================================
INSERT INTO accelerator_programs (name, slug, description, website_url, application_url, batch_name, location, is_remote_friendly, sectors, stage, equity_taken, investment_amount, program_length_weeks, notable_alumni) VALUES
  (
    'Y Combinator', 'yc',
    'The most prestigious startup accelerator',
    'https://www.ycombinator.com',
    'https://www.ycombinator.com/apply',
    'W26', 'San Francisco, CA', false,
    ARRAY['saas','marketplace','hardware','services','other'],
    'pre_seed', 0.07, '$500K', 12,
    ARRAY['Airbnb','Stripe','Dropbox','Reddit','DoorDash']
  ),
  (
    'Techstars', 'techstars',
    'Global accelerator network with industry-specific programs',
    'https://www.techstars.com',
    'https://www.techstars.com/accelerators',
    'Summer 2026', 'Multiple cities', true,
    ARRAY['saas','marketplace','hardware','services'],
    'pre_seed', 0.06, '$120K', 13,
    ARRAY['SendGrid','DigitalOcean','Sphero','ClassPass']
  ),
  (
    '500 Global', '500-global',
    'Global venture capital firm and accelerator',
    'https://500.co',
    'https://500.co/accelerator',
    '2026', 'San Francisco, CA', true,
    ARRAY['saas','marketplace','services'],
    'seed', 0.06, '$150K', 16,
    ARRAY['Canva','Grab','Talkdesk','Credit Karma']
  ),
  (
    'Precursor Ventures', 'precursor',
    'Pre-seed fund backing underrepresented founders',
    'https://precursorvc.com',
    'https://precursorvc.com/apply',
    null, 'San Francisco, CA', true,
    ARRAY['saas','marketplace','services'],
    'pre_seed', 0.00, '$250K-1M', 0,
    ARRAY['Walker & Company','Mayvenn']
  ),
  (
    'South Park Commons', 'spc',
    'Community for builders exploring what is next',
    'https://www.southparkcommons.com',
    'https://www.southparkcommons.com/apply',
    null, 'San Francisco, CA', false,
    ARRAY['saas','hardware','other'],
    'pre_seed', 0.00, 'No investment', 0,
    ARRAY['Figma (early)','Notion (early)']
  );

COMMIT;

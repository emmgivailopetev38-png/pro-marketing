-- New 'presentation_sent' stage between discovery and offer_sent.
-- For clients who received a personal presentation/pitch page but no formal
-- priced offer yet.

alter type public.contact_stage add value if not exists 'presentation_sent' before 'offer_sent';

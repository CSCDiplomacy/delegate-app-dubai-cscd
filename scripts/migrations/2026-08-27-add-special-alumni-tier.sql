-- Adds 'special_alumni' to delegates.result_tier. New tier from the client's
-- recreated results workbook (ysf-dubai-result-recreated.xlsx): the original
-- single Alumni sheet split into `Alumni` (pays, same as partial/self) and
-- `Special Alumni` (no payment, same treatment as `full`). Applied directly
-- via the Supabase MCP (apply_migration) against pjdbvjiemguepdyzhlft on
-- 2026-08-27 — see app_brain/Dubai Fork Progress.md for the full story.
alter table public.delegates
  drop constraint if exists delegates_result_tier_check;

alter table public.delegates
  add constraint delegates_result_tier_check
  check (result_tier is null or result_tier in ('self', 'partial', 'full', 'alumni', 'special_alumni'));

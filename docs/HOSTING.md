# Low-cost launch path

Decision (November 2026): reuse the existing **q-me** Supabase project for the
Dicey beta, with `dicey_` database/function names. Keep development and regression
tests on the isolated local stack. No paid plan or new hosted project is needed
for this step, while usage fits the existing free quotas.

Supabase currently allows two active Free projects. Pro starts at US$25/month
including one Micro project's compute credit; additional Micro projects start
around US$10/month. Several apps can share one backend project. Pricing source:
[Supabase billing FAQ](https://supabase.com/docs/guides/platform/billing-faq).

A shared project also shares Auth users, email templates, credentials, quotas,
and operational settings. Prefixes organise tables; row-level policies enforce
access. Do not push Dicey's complete local config or overwrite q-me migration
history. Keep shared email/login changes separate from additive game migrations.

Before a broader public release, review isolation, backups, email delivery,
usage, and whether Dicey warrants its own project. A web-first beta can avoid
store distribution costs initially; Cloudflare Pages has a free static hosting
plan ([limits](https://developers.cloudflare.com/pages/platform/limits/)).
Native store distribution has separate account fees: Apple lists US$99 annually
([program](https://developer.apple.com/programs/)); Google Play lists a US$25
one-time registration fee ([setup](https://support.google.com/googleplay/android-developer/answer/6112435)).
Existing memberships may already cover these; none has been purchased here.

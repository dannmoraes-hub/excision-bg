# Excision BG — DannMoraes

Cyber Blue Moon background remover UI, prepared for GitHub + Netlify.

## Deploy
1. Push this folder to GitHub.
2. Import the repo into Netlify.
3. Add environment variable `REMOVEBG_API_KEY` in Netlify.
4. The Netlify Function is available at `/.netlify/functions/remove-bg`.

The frontend must call the function; never expose the API key in browser JavaScript.

## Real-time global usage stats

The homepage stats are now shared globally instead of using browser `localStorage`.
They show:
- **People using now**: anonymous browser sessions seen in the last 60 seconds.
- **Backgrounds removed**: global processing count stored in Supabase.

### Supabase setup
Create a Supabase project, then run the SQL below in the SQL Editor:

```sql
create table if not exists public.excision_sessions (
  session_id text primary key,
  last_seen timestamptz not null default now()
);

create table if not exists public.excision_stats (
  id integer primary key,
  total_processed bigint not null default 0
);

insert into public.excision_stats (id, total_processed)
values (1, 0)
on conflict (id) do nothing;

create or replace function public.increment_excision_processed()
returns void
language sql
security definer
as $$
  update public.excision_stats
  set total_processed = total_processed + 1
  where id = 1;
$$;

alter table public.excision_sessions enable row level security;
alter table public.excision_stats enable row level security;
```

Set these Netlify environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REMOVEBG_API_KEY`

Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Never put it in `index.html`.

-- Create text_objects table
create table if not exists public.text_objects (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  hour integer not null,
  text text not null,
  position jsonb default '{"x": 100, "y": 50}'::jsonb,
  scale real default 1,
  rotation real default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date not null
);

-- Add RLS policies
alter table public.text_objects enable row level security;

-- Policy: Users can view their own text objects
create policy "Users can view own text objects"
  on public.text_objects for select
  using (true);

-- Policy: Users can insert their own text objects
create policy "Users can insert own text objects"
  on public.text_objects for insert
  with check (true);

-- Policy: Users can update their own text objects
create policy "Users can update own text objects"
  on public.text_objects for update
  using (true);

-- Policy: Users can delete their own text objects
create policy "Users can delete own text objects"
  on public.text_objects for delete
  using (true);

-- Create index for faster queries
create index if not exists text_objects_user_id_date_idx on public.text_objects (user_id, date);

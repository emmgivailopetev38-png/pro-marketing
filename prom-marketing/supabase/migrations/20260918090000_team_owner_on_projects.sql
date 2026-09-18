-- Отговорник по проект и изпълнител по задача.
-- Досега нямаше къде да се запише „този проект е на Х“, затова всяко човешко
-- действие в CRM-а изглеждаше като работа на Ивайло. NULL = при Ивайло.
alter table public.projects
  add column if not exists owner_id uuid references public.team_members(id) on delete set null;

alter table public.project_tasks
  add column if not exists assignee_id uuid references public.team_members(id) on delete set null;

create index if not exists projects_owner_id_idx on public.projects(owner_id) where owner_id is not null;
create index if not exists project_tasks_assignee_id_idx on public.project_tasks(assignee_id) where assignee_id is not null;

comment on column public.projects.owner_id is 'Кой от екипа движи проекта; NULL = при Ивайло.';
comment on column public.project_tasks.assignee_id is 'Кой изпълнява задачата; NULL = наследява отговорника на проекта.';

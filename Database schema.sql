CREATE TABLE public.profiles (
  id uuid NOT NULL,
  updated_at timestamp with time zone,
  username text UNIQUE CHECK (char_length(username) >= 3),
  full_name text,
  role USER-DEFINED DEFAULT 'User'::user_roles,
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.projects (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title character varying,
  description text,
  created_by uuid,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.tasks (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  project_id bigint,
  title text,
  description text,
  due_date date,
  priority USER-DEFINED DEFAULT 'MEDIUM'::priorities,
  status USER-DEFINED DEFAULT 'TO DO'::statuses,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.tasks_assigned_users (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  task_id bigint,
  CONSTRAINT tasks_assigned_users_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_assigned_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT tasks_assigned_users_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id)
);

/* Row level policies */
[
  {
    "schemaname": "public",
    "tablename": "tasks_assigned_users",
    "policyname": "Enable delete for authenticated users",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tasks_assigned_users",
    "policyname": "Enable update for authenticated users",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "true",
    "with_check": "(( SELECT auth.uid() AS uid) = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "tasks_assigned_users",
    "policyname": "Enable insert for authenticated users only",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "tasks_assigned_users",
    "policyname": "Enable read access for all users",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can update own profile.",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(( SELECT auth.uid() AS uid) = id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can insert their own profile.",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(( SELECT auth.uid() AS uid) = id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Public profiles are viewable by everyone.",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "projects",
    "policyname": "Enable update for users based on user_id",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(( SELECT auth.uid() AS uid) = created_by)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "projects",
    "policyname": "Enable insert for users based on user_id",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(( SELECT auth.uid() AS uid) = created_by)"
  },
  {
    "schemaname": "public",
    "tablename": "projects",
    "policyname": "Enable delete for users based on user_id",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(( SELECT auth.uid() AS uid) = created_by)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "projects",
    "policyname": "Enable read access for all users",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "Anyone can update their own avatar.",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(( SELECT auth.uid() AS uid) = owner)",
    "with_check": "(bucket_id = 'avatars'::text)"
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "Anyone can upload an avatar.",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(bucket_id = 'avatars'::text)"
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "Avatar images are publicly accessible.",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(bucket_id = 'avatars'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tasks",
    "policyname": "Project managers and admins can delete any task",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['Project manager'::user_roles, 'Administrator'::user_roles])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tasks",
    "policyname": "Project managers and admins can update any task",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['Project manager'::user_roles, 'Administrator'::user_roles])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tasks",
    "policyname": "Enable update for authenticated users only",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tasks",
    "policyname": "Enable delete for users based on user_id",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(( SELECT auth.uid() AS uid) = created_by)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tasks",
    "policyname": "Enable insert for authenticated users only",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "tasks",
    "policyname": "Enable read access for authenticated users",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  }
]
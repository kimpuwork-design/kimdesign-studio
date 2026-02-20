
-- =============================
-- TABLE: leads
-- =============================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_lead_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('new', 'contacted', 'archived') THEN
    RAISE EXCEPTION 'Invalid lead status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_lead_status
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_lead_status();

-- =============================
-- TABLE: projects
-- =============================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'inquiry',
  location TEXT,
  start_date DATE,
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_project_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('inquiry', 'active', 'review', 'delivered', 'archived') THEN
    RAISE EXCEPTION 'Invalid project status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_project_status
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.validate_project_status();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================
-- TABLE: project_members
-- =============================
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE OR REPLACE FUNCTION public.validate_member_role()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.member_role NOT IN ('CLIENT', 'STAFF', 'ADMIN') THEN
    RAISE EXCEPTION 'Invalid member role: %', NEW.member_role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_member_role
  BEFORE INSERT OR UPDATE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.validate_member_role();

-- =============================
-- TABLE: audit_logs
-- =============================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================
-- INDEXES
-- =============================
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- =============================
-- SECURITY DEFINER HELPERS (avoid RLS recursion)
-- =============================

-- Check if user is a member of a project (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id AND user_id = _user_id
  )
$$;

-- Check if user is the client owner of a project (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_project_client(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND client_id = _user_id
  )
$$;

-- =============================
-- RLS: leads
-- =============================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
  ON public.leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- =============================
-- RLS: projects
-- =============================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins see all projects"
  ON public.projects FOR SELECT
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Clients see their own projects"
  ON public.projects FOR SELECT
  USING (public.has_role(auth.uid(), 'CLIENT') AND client_id = auth.uid());

CREATE POLICY "Staff see assigned projects"
  ON public.projects FOR SELECT
  USING (
    public.has_role(auth.uid(), 'STAFF') AND
    public.is_project_member(auth.uid(), id)
  );

CREATE POLICY "Admins can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can update projects"
  ON public.projects FOR UPDATE
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- =============================
-- RLS: project_members
-- =============================
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins see all project members"
  ON public.project_members FOR SELECT
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Staff see members of assigned projects"
  ON public.project_members FOR SELECT
  USING (
    public.has_role(auth.uid(), 'STAFF') AND
    public.is_project_member(auth.uid(), project_id)
  );

CREATE POLICY "Clients see members of their projects"
  ON public.project_members FOR SELECT
  USING (
    public.has_role(auth.uid(), 'CLIENT') AND
    public.is_project_client(auth.uid(), project_id)
  );

CREATE POLICY "Admins can insert project members"
  ON public.project_members FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can update project members"
  ON public.project_members FOR UPDATE
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can delete project members"
  ON public.project_members FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- =============================
-- RLS: audit_logs
-- =============================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert their own audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Staff can view logs for their projects"
  ON public.audit_logs FOR SELECT
  USING (
    public.has_role(auth.uid(), 'STAFF') AND
    entity_type = 'project' AND
    public.is_project_member(auth.uid(), entity_id)
  );

CREATE POLICY "Clients can view logs for their projects"
  ON public.audit_logs FOR SELECT
  USING (
    public.has_role(auth.uid(), 'CLIENT') AND
    entity_type = 'project' AND
    public.is_project_client(auth.uid(), entity_id)
  );

CREATE POLICY "Admins can update audit logs"
  ON public.audit_logs FOR UPDATE
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can delete audit logs"
  ON public.audit_logs FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'));

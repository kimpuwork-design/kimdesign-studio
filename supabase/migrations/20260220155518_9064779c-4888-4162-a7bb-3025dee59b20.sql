
-- ======================================================
-- STEP 7: Quotes, Invoices, Quote Items, Invoice Items, Payments
-- ======================================================

-- 1. quotes
CREATE TABLE public.quotes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by     uuid NOT NULL REFERENCES public.profiles(id),
  title          text NOT NULL,
  notes          text,
  status         text NOT NULL DEFAULT 'draft',
  subtotal       numeric(12,2) NOT NULL DEFAULT 0,
  tax            numeric(12,2) NOT NULL DEFAULT 0,
  total          numeric(12,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'USD',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_project ON public.quotes(project_id, status, created_at DESC);

-- 2. quote_items
CREATE TABLE public.quote_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id     uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description  text NOT NULL,
  qty          numeric(12,2) NOT NULL DEFAULT 1,
  unit_price   numeric(12,2) NOT NULL DEFAULT 0,
  line_total   numeric(12,2) NOT NULL DEFAULT 0,
  sort_order   int DEFAULT 0
);

-- 3. invoices
CREATE TABLE public.invoices (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                 uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by                 uuid NOT NULL REFERENCES public.profiles(id),
  invoice_number             text UNIQUE NOT NULL,
  status                     text NOT NULL DEFAULT 'draft',
  issue_date                 date NOT NULL DEFAULT CURRENT_DATE,
  due_date                   date,
  notes                      text,
  subtotal                   numeric(12,2) NOT NULL DEFAULT 0,
  tax                        numeric(12,2) NOT NULL DEFAULT 0,
  total                      numeric(12,2) NOT NULL DEFAULT 0,
  currency                   text NOT NULL DEFAULT 'USD',
  pdf_url                    text,
  stripe_checkout_session_id text,
  paid_at                    timestamptz,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_project ON public.invoices(project_id, status, created_at DESC);

-- 4. invoice_items
CREATE TABLE public.invoice_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description  text NOT NULL,
  qty          numeric(12,2) NOT NULL DEFAULT 1,
  unit_price   numeric(12,2) NOT NULL DEFAULT 0,
  line_total   numeric(12,2) NOT NULL DEFAULT 0,
  sort_order   int DEFAULT 0
);

-- 5. payments
CREATE TABLE public.payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  provider     text NOT NULL DEFAULT 'stripe',
  provider_ref text,
  amount       numeric(12,2) NOT NULL,
  currency     text NOT NULL,
  status       text NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ======================================================
-- Triggers: updated_at
-- ======================================================
CREATE TRIGGER trg_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ======================================================
-- Validation triggers (no CHECK constraints on status)
-- ======================================================
CREATE OR REPLACE FUNCTION public.validate_quote_status()
  RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('draft','sent','accepted','rejected') THEN
    RAISE EXCEPTION 'Invalid quote status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_quote_status
  BEFORE INSERT OR UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.validate_quote_status();

CREATE OR REPLACE FUNCTION public.validate_invoice_status()
  RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('draft','sent','paid','void') THEN
    RAISE EXCEPTION 'Invalid invoice status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_invoice_status
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.validate_invoice_status();

CREATE OR REPLACE FUNCTION public.validate_payment_status()
  RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending','succeeded','failed','refunded') THEN
    RAISE EXCEPTION 'Invalid payment status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_payment_status
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.validate_payment_status();

-- ======================================================
-- Invoice number generator: INV-YYYY-NNNN
-- ======================================================
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
  RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_year text;
  v_seq  int;
  v_num  text;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || v_year || '-%';
  v_num := 'INV-' || v_year || '-' || LPAD(v_seq::text, 4, '0');
  RETURN v_num;
END;
$$;

-- ======================================================
-- Notification fanout for quotes & invoices
-- ======================================================
CREATE OR REPLACE FUNCTION public.fanout_quote_notifications()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_project RECORD;
  v_recipient uuid;
BEGIN
  SELECT p.id, p.title, p.client_id INTO v_project
  FROM public.projects p WHERE p.id = NEW.project_id;

  -- quote_sent -> notify client
  IF NEW.status = 'sent' AND (OLD IS NULL OR OLD.status <> 'sent') THEN
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (
      v_project.client_id, 'system',
      'Quote ready for review',
      v_project.title || ': ' || NEW.title,
      '/app/projects/' || NEW.project_id::text || '?tab=billing'
    );
  END IF;

  -- quote accepted/rejected -> notify staff
  IF NEW.status IN ('accepted','rejected') AND (OLD IS NULL OR OLD.status NOT IN ('accepted','rejected')) THEN
    FOR v_recipient IN
      SELECT pm.user_id FROM public.project_members pm
      WHERE pm.project_id = NEW.project_id AND pm.member_role IN ('STAFF','ADMIN')
    LOOP
      INSERT INTO public.notifications(user_id, type, title, body, link)
      VALUES (
        v_recipient, 'system',
        'Quote ' || NEW.status,
        v_project.title || ': ' || NEW.title,
        '/staff/projects/' || NEW.project_id::text || '?tab=billing'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_fanout_quote_notifications
  AFTER INSERT OR UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.fanout_quote_notifications();

CREATE OR REPLACE FUNCTION public.fanout_invoice_notifications()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_project RECORD;
  v_recipient uuid;
BEGIN
  SELECT p.id, p.title, p.client_id INTO v_project
  FROM public.projects p WHERE p.id = NEW.project_id;

  -- invoice_sent -> notify client
  IF NEW.status = 'sent' AND (OLD IS NULL OR OLD.status <> 'sent') THEN
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (
      v_project.client_id, 'system',
      'Invoice ' || NEW.invoice_number || ' sent',
      v_project.title || ' · ' || NEW.currency || ' ' || NEW.total::text,
      '/app/projects/' || NEW.project_id::text || '?tab=billing'
    );
  END IF;

  -- invoice_paid -> notify staff/admin
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status <> 'paid') THEN
    FOR v_recipient IN
      SELECT pm.user_id FROM public.project_members pm
      WHERE pm.project_id = NEW.project_id AND pm.member_role IN ('STAFF','ADMIN')
    LOOP
      INSERT INTO public.notifications(user_id, type, title, body, link)
      VALUES (
        v_recipient, 'system',
        'Invoice paid: ' || NEW.invoice_number,
        v_project.title || ' · ' || NEW.currency || ' ' || NEW.total::text,
        '/admin/invoices'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_fanout_invoice_notifications
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.fanout_invoice_notifications();

-- ======================================================
-- RLS
-- ======================================================
ALTER TABLE public.quotes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments    ENABLE ROW LEVEL SECURITY;

-- QUOTES --
CREATE POLICY "Users with project access can view quotes"
  ON public.quotes FOR SELECT
  USING (public.user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Staff/Admin can insert quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    public.user_has_project_access(auth.uid(), project_id) AND
    (public.has_role(auth.uid(), 'ADMIN'::app_role) OR public.has_role(auth.uid(), 'STAFF'::app_role))
  );

CREATE POLICY "Staff/Admin can update quotes"
  ON public.quotes FOR UPDATE
  USING (
    public.user_has_project_access(auth.uid(), project_id) AND
    (public.has_role(auth.uid(), 'ADMIN'::app_role) OR public.has_role(auth.uid(), 'STAFF'::app_role))
  );

CREATE POLICY "Clients can accept/reject their quotes"
  ON public.quotes FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'CLIENT'::app_role) AND
    public.is_project_client(auth.uid(), project_id)
  );

CREATE POLICY "Admins can delete quotes"
  ON public.quotes FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

-- QUOTE_ITEMS --
CREATE POLICY "Users with project access can view quote items"
  ON public.quote_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = quote_items.quote_id AND public.user_has_project_access(auth.uid(), q.project_id)
  ));

CREATE POLICY "Staff/Admin can insert quote items"
  ON public.quote_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = quote_items.quote_id AND
      public.user_has_project_access(auth.uid(), q.project_id) AND
      (public.has_role(auth.uid(), 'ADMIN'::app_role) OR public.has_role(auth.uid(), 'STAFF'::app_role))
  ));

CREATE POLICY "Staff/Admin can update quote items"
  ON public.quote_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = quote_items.quote_id AND
      public.user_has_project_access(auth.uid(), q.project_id) AND
      (public.has_role(auth.uid(), 'ADMIN'::app_role) OR public.has_role(auth.uid(), 'STAFF'::app_role))
  ));

CREATE POLICY "Admins can delete quote items"
  ON public.quote_items FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

-- INVOICES --
CREATE POLICY "Users with project access can view invoices"
  ON public.invoices FOR SELECT
  USING (public.user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Staff/Admin can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    public.user_has_project_access(auth.uid(), project_id) AND
    (public.has_role(auth.uid(), 'ADMIN'::app_role) OR public.has_role(auth.uid(), 'STAFF'::app_role))
  );

CREATE POLICY "Staff/Admin can update invoices"
  ON public.invoices FOR UPDATE
  USING (
    public.user_has_project_access(auth.uid(), project_id) AND
    (public.has_role(auth.uid(), 'ADMIN'::app_role) OR public.has_role(auth.uid(), 'STAFF'::app_role))
  );

CREATE POLICY "Admins can delete/void invoices"
  ON public.invoices FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

-- INVOICE_ITEMS --
CREATE POLICY "Users with project access can view invoice items"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id AND public.user_has_project_access(auth.uid(), i.project_id)
  ));

CREATE POLICY "Staff/Admin can insert invoice items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id AND
      public.user_has_project_access(auth.uid(), i.project_id) AND
      (public.has_role(auth.uid(), 'ADMIN'::app_role) OR public.has_role(auth.uid(), 'STAFF'::app_role))
  ));

CREATE POLICY "Staff/Admin can update invoice items"
  ON public.invoice_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id AND
      public.user_has_project_access(auth.uid(), i.project_id) AND
      (public.has_role(auth.uid(), 'ADMIN'::app_role) OR public.has_role(auth.uid(), 'STAFF'::app_role))
  ));

CREATE POLICY "Admins can delete invoice items"
  ON public.invoice_items FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

-- PAYMENTS --
CREATE POLICY "Users with project access can view payments"
  ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = payments.invoice_id AND public.user_has_project_access(auth.uid(), i.project_id)
  ));

CREATE POLICY "Staff/Admin can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'ADMIN'::app_role) OR public.has_role(auth.uid(), 'STAFF'::app_role)
  );

CREATE POLICY "Staff/Admin can update payments"
  ON public.payments FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'ADMIN'::app_role) OR public.has_role(auth.uid(), 'STAFF'::app_role)
  );

-- Storage bucket for private invoice PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-pdfs', 'invoice-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for invoice-pdfs bucket
CREATE POLICY "Admins/Staff can upload invoice PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'invoice-pdfs' AND (
      public.has_role(auth.uid(), 'ADMIN'::app_role) OR
      public.has_role(auth.uid(), 'STAFF'::app_role)
    )
  );

CREATE POLICY "Admins/Staff can update invoice PDFs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'invoice-pdfs' AND (
      public.has_role(auth.uid(), 'ADMIN'::app_role) OR
      public.has_role(auth.uid(), 'STAFF'::app_role)
    )
  );

CREATE POLICY "Project members can download invoice PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'invoice-pdfs' AND auth.role() = 'authenticated'
  );

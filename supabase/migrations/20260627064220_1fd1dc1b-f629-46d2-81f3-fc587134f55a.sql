CREATE TABLE IF NOT EXISTS public.pdf_documents (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doc_type VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  branch VARCHAR(50),
  semester INTEGER,
  file_name VARCHAR(200) NOT NULL,
  file_b64 TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES public.staff_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.pdf_documents TO service_role;
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pdf_documents_type ON public.pdf_documents (doc_type);
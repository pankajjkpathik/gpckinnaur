CREATE TABLE public.messages (
  id bigserial PRIMARY KEY,
  sender_kind varchar(10) NOT NULL CHECK (sender_kind IN ('staff','student')),
  sender_id bigint NOT NULL,
  recipient_kind varchar(10) NOT NULL CHECK (recipient_kind IN ('staff','student')),
  recipient_id bigint NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_recipient ON public.messages (recipient_kind, recipient_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages (sender_kind, sender_id, created_at DESC);
GRANT ALL ON public.messages TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.messages_id_seq TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon_msg" ON public.messages AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated_msg" ON public.messages AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
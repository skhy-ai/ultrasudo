-- =============================================================================
-- Ultrasudo Initial Schema Migration
-- Supabase Project: uzwkvctnmruesdhtfbvz
-- Description: Creates all application tables with RLS, PQC encryption markers,
--              and auto-profile trigger. All user-generated encrypted content
--              uses enc_ prefix columns (stored as device-encrypted ciphertext).
-- =============================================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- TABLE: user_profiles
-- Auto-created on auth.users insert via trigger.
-- Stores non-sensitive user metadata in plaintext.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name     TEXT,
    avatar_url    TEXT,
    bio           TEXT,
    timezone      TEXT DEFAULT 'UTC',
    theme         TEXT DEFAULT 'dark',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles: users manage own profile"
    ON public.user_profiles
    FOR ALL
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Trigger: auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- TABLE: app_data
-- Generic key-value store mapping data-manager.js entries to the cloud.
-- encrypted_value stores PQC/AES-GCM ciphertext (PQC:v1:... prefix).
-- enc_version tracks the encryption scheme version (1 = AES-256-GCM).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.app_data (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    app_name        TEXT NOT NULL,
    key             TEXT NOT NULL,
    encrypted_value TEXT,                  -- PQC device-encrypted ciphertext
    enc_version     SMALLINT DEFAULT 1,    -- 1 = AES-256-GCM (PQC:v1:...)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, app_name, key)
);

ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_data: users manage own data"
    ON public.app_data
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- TABLE: shared_notes
-- Cross-app notes. Title is plaintext (searchable). Content is device-encrypted.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.shared_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL DEFAULT 'Untitled',   -- plaintext for search
    enc_content TEXT,                               -- PQC device-encrypted
    enc_version SMALLINT DEFAULT 1,
    tags        TEXT[] DEFAULT '{}',
    app_source  TEXT NOT NULL DEFAULT 'desktop',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_notes: users manage own notes"
    ON public.shared_notes
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- TABLE: tasks
-- Cross-app task management. No PII — stored plaintext.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL DEFAULT 'Untitled Task',
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority    TEXT NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date    TIMESTAMPTZ,
    app_source  TEXT NOT NULL DEFAULT 'desktop',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks: users manage own tasks"
    ON public.tasks
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- TABLE: api_keys
-- Encrypted API key storage. enc_value stores PQC ciphertext.
-- Never stored plaintext. provider is plaintext (e.g. 'openai', 'gemini').
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider    TEXT NOT NULL,              -- e.g. 'openai', 'gemini', 'lmstudio'
    enc_value   TEXT NOT NULL,             -- PQC device-encrypted key data
    enc_version SMALLINT DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider)
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys: users manage own keys"
    ON public.api_keys
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- TABLE: devices
-- Extends the existing devices table with full structure.
-- device_key_hash stores BLAKE2/SHA-256 hash of device PQC key (never the key).
-- =============================================================================
DO $$
BEGIN
    -- Add user_id if missing (existing table may lack it)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='devices' AND column_name='user_id'
    ) THEN
        ALTER TABLE public.devices ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='devices' AND column_name='device_name'
    ) THEN
        ALTER TABLE public.devices ADD COLUMN device_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='devices' AND column_name='device_key_hash'
    ) THEN
        ALTER TABLE public.devices ADD COLUMN device_key_hash TEXT;  -- SHA-256 of pqc_device_key
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='devices' AND column_name='last_seen'
    ) THEN
        ALTER TABLE public.devices ADD COLUMN last_seen TIMESTAMPTZ DEFAULT now();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='devices' AND column_name='created_at'
    ) THEN
        ALTER TABLE public.devices ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "devices: users manage own devices" ON public.devices;
CREATE POLICY "devices: users manage own devices"
    ON public.devices
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- TABLE: transactions
-- Extends the existing transactions table.
-- enc_metadata stores device-encrypted PII (merchant name, notes, etc.)
-- Amount, currency, category remain plaintext for analytics.
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='transactions' AND column_name='user_id'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='transactions' AND column_name='enc_metadata'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN enc_metadata TEXT;  -- PQC encrypted
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='transactions' AND column_name='category'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN category TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='transactions' AND column_name='currency'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;
END $$;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions: users manage own transactions" ON public.transactions;
CREATE POLICY "transactions: users manage own transactions"
    ON public.transactions
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- HELPER: updated_at auto-update trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_app_data_updated_at
    BEFORE UPDATE ON public.app_data
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_shared_notes_updated_at
    BEFORE UPDATE ON public.shared_notes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- GRANT: Ensure authenticated role can access all tables
-- =============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.app_data TO authenticated;
GRANT ALL ON public.shared_notes TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.api_keys TO authenticated;
GRANT ALL ON public.devices TO authenticated;
GRANT ALL ON public.transactions TO authenticated;

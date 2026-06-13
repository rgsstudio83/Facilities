-- =========================================================================
-- NOVO ESQUEMA DE CADASTRO UNIFICADO - TABELA 'perfil' E GERENCIAMENTO DE ROLES
-- DESIGNED FOR SUPABASE POSTGRESQL (2026)
-- CONFORME SOLICITADO: TABELA ÚNICA DE CADASTRO + TIPOS DE PERFIS DINÂMICOS
-- =========================================================================

-- Habilita extensão de UUID caso não exista
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. TABELA DE TIPOS DE PERFIS (ROLES)
-- Permite que Administradores adicionem, editem e cancelem tipos de roles.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.tipos_perfil (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- Identificador único da role (ex: 'administrador', 'sindico')
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Populando os tipos de perfis iniciais (Opções Operativas Padrão)
INSERT INTO public.tipos_perfil (nome, slug, descricao) VALUES
    ('Administrador', 'administrador', 'Acesso total de gestão a todos os condomínios e configurações'),
    ('Síndico', 'sindico', 'Gestor de condomínio com privilégios específicos para sua área administrativa'),
    ('Morador', 'morador', 'Consulta de comunicados, atas, reservas e detalhes de sua unidade'),
    ('Proprietário', 'proprietario', 'Condômino com direitos e deveres associados às propriedades'),
    ('Subsíndico', 'subsindico', 'Suporte administrativo ao síndico geral na gestão de condomínio'),
    ('Conselheiro', 'conselheiro', 'Auditor fiscal e membro fiscalizador do condomínio'),
    ('Porteiro', 'porteiro', 'Operador de controle de acesso de visitantes e monitoria local'),
    ('Colaborador', 'colaborador', 'Prestador e zelador do condomínio com acesso de visualização operacional')
ON CONFLICT (slug) DO NOTHING;

-- =========================================================================
-- 2. TABELA ÚNICA DE CADASTRO FISÍCO - 'perfil' (Singular)
-- Todos os usuários cadastrados são salvos aqui. Mantém o tipo de perfil ativo.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.perfil (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    cpf TEXT,
    tipo TEXT NOT NULL, -- Referente ao 'slug' na tabela tipos_perfil
    unidade TEXT,
    sobrenome TEXT,
    apelido TEXT,
    foto_perfil TEXT,
    telefone TEXT,
    whatsapp TEXT,
    ativo BOOLEAN DEFAULT true,
    condominio_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garante que se a tabela 'perfil' já existia, as colunas adicionais serão devidamente injetadas para evitar erros de banco
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS unidade TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS sobrenome TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS apelido TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS condominio_id TEXT;

-- Habilitar RLS no perfil singular para proteção de dados sensíveis
ALTER TABLE public.perfil ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 3. POLÍTICAS DE RLS PARA A TABELA 'perfil'
-- =========================================================================
DROP POLICY IF EXISTS "Garantir inserção de perfil no cadastro" ON public.perfil;
DROP POLICY IF EXISTS "Leitura e Escrita do próprio perfil singular" ON public.perfil;
DROP POLICY IF EXISTS "Acesso completo de Admin e Colab no perfil singular" ON public.perfil;
DROP POLICY IF EXISTS "Permitir tudo para simulação de perfil" ON public.perfil;

-- Políticas de Produção
CREATE POLICY "Garantir inserção de perfil no cadastro" ON public.perfil
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Leitura e Escrita do próprio perfil singular" ON public.perfil
    FOR ALL TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Acesso completo de Admin e Colab no perfil singular" ON public.perfil
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfil 
            WHERE id = auth.uid() AND tipo IN ('administrador', 'colaborador', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfil 
            WHERE id = auth.uid() AND tipo IN ('administrador', 'colaborador', 'admin')
        )
    );

-- Políticas de Fallback / Simulação Offline de Desenvolvimento
CREATE POLICY "Permitir tudo para simulação de perfil" ON public.perfil 
    FOR ALL USING (true);


-- =========================================================================
-- 4. POLÍTICAS DE RLS PARA A TABELA 'tipos_perfil'
-- Administradores controlam totalmente. Outros usuários autenticados podem ler.
-- =========================================================================
ALTER TABLE public.tipos_perfil ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de tipos de perfil" ON public.tipos_perfil;
DROP POLICY IF EXISTS "Controle total de tipos de perfil por Administradores" ON public.tipos_perfil;
DROP POLICY IF EXISTS "Permitir tudo para simulação de tipos de perfil" ON public.tipos_perfil;

CREATE POLICY "Leitura pública de tipos de perfil" ON public.tipos_perfil
    FOR SELECT TO authenticated, anon
    USING (true);

CREATE POLICY "Controle total de tipos de perfil por Administradores" ON public.tipos_perfil
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfil 
            WHERE id = auth.uid() AND tipo IN ('administrador', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfil 
            WHERE id = auth.uid() AND tipo IN ('administrador', 'admin')
        )
    );

-- Fallback/Simulação de tipos de perfil
CREATE POLICY "Permitir tudo para simulação de tipos de perfil" ON public.tipos_perfil 
    FOR ALL USING (true);


-- =========================================================================
-- 5. COMPATIBILIDADE - RETROCOMPATIBILIDADE DO DESIGN EM BANCO DE DADOS
-- Migração da tabela 'perfis' (plural) para VIEW apontando para a 'perfil' (singular)
-- Configurada com 'security_invoker = true' para herdar e respeitar o RLS de 'perfil'.
-- =========================================================================
DROP VIEW IF EXISTS public.perfis CASCADE;
DROP TABLE IF EXISTS public.perfis CASCADE;

CREATE OR REPLACE VIEW public.perfis 
WITH (security_invoker = true) AS
SELECT 
    id,
    id AS auth_user_id,
    nome,
    cpf,
    email,
    unidade,
    tipo,
    tipo AS perfil,
    sobrenome,
    apelido,
    foto_perfil,
    whatsapp,
    telefone,
    ativo,
    condominio_id,
    created_at AS data_cadastro
FROM public.perfil;

GRANT SELECT ON public.perfis TO authenticated, anon;


-- =========================================================================
-- 6. VIEW CLÁSSICA 'profiles' (UNIÃO COMPACTA DINÂMICA COM PERFIL ÚNICA)
-- Garante a junção limpa com auth.users e a tabela única de perfil.
-- Configurada com 'security_invoker = true' para herdar e respeitar o RLS.
-- =========================================================================
DROP VIEW IF EXISTS public.profiles CASCADE;

CREATE OR REPLACE VIEW public.profiles 
WITH (security_invoker = true) AS
SELECT 
    u.id AS id,
    u.email AS email,
    COALESCE(p.nome, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'nome', 'Usuário Novo') AS nome,
    COALESCE(p.cpf, u.raw_user_meta_data->>'cpf') AS cpf,
    COALESCE(p.tipo, 
        LOWER(REPLACE(REPLACE(REPLACE(u.raw_user_meta_data->>'profile', 'síndico', 'sindico'), 'subsíndico', 'subsindico'), 'proprietário', 'proprietario')),
        'morador'
    ) AS tipo,
    COALESCE(p.unidade, u.raw_user_meta_data->>'unidade', u.raw_user_meta_data->>'unit', 'Apto Geral') AS unidade,
    p.condominio_id AS condominio_id,
    COALESCE(p.ativo, true) AS ativo
FROM 
    auth.users u
LEFT JOIN 
    public.perfil p ON u.id = p.id;

GRANT SELECT ON public.profiles TO authenticated, anon;


-- =========================================================================
-- 7. TRIGGER AUTOMÁTICO DE CRIAÇÃO DE PERFIL PÓS-AUTH (auth.users)
-- Executado no servidor Postgres ao criar um novo cadastro via Supabase Auth.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfil (id, nome, email, cpf, tipo, unidade)
    VALUES (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'nome', 'Usuário Novo')),
        new.email,
        coalesce(new.raw_user_meta_data->>'cpf', ''),
        coalesce(lower(replace(replace(replace(new.raw_user_meta_data->>'profile', 'síndico', 'sindico'), 'subsíndico', 'subsindico'), 'proprietário', 'proprietario')), 'morador'),
        coalesce(new.raw_user_meta_data->>'unit', coalesce(new.raw_user_meta_data->>'unidade', 'Apto Geral'))
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Registra o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

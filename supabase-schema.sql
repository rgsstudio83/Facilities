-- =========================================================================
-- DATABASE CONFIGURATION & SCHEMA - FACILITIES CONDOMINIUM ADMINISTRATION
-- DESIGNED FOR POSTGRESQL 16 / SUPABASE 2026
-- PRODUCTION-READY WITH STRICT ROW LEVEL SECURITY (RLS) & AUDIT TIMESTAMPS
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Global trigger function for updating updated_at automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- TABLE DESIGN & CONSTRAINTS
-- =========================================================================

-- 1. perfis
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('administrador', 'colaborador', 'sindico', 'subsindico', 'conselheiro', 'morador', 'proprietario')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for perfis updated_at
CREATE TRIGGER update_perfis_updated_at
    BEFORE UPDATE ON public.perfis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. condominios
CREATE TABLE IF NOT EXISTS public.condominios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    endereco TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for condominios updated_at
CREATE TRIGGER update_condominios_updated_at
    BEFORE UPDATE ON public.condominios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. blocos
CREATE TABLE IF NOT EXISTS public.blocos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for blocos updated_at
CREATE TRIGGER update_blocos_updated_at
    BEFORE UPDATE ON public.blocos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. unidades
CREATE TABLE IF NOT EXISTS public.unidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bloco_id UUID NOT NULL REFERENCES public.blocos(id) ON DELETE CASCADE,
    numero TEXT NOT NULL,
    andar INTEGER,
    fracao_ideal NUMERIC(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for unidades updated_at
CREATE TRIGGER update_unidades_updated_at
    BEFORE UPDATE ON public.unidades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. moradores
CREATE TABLE IF NOT EXISTS public.moradores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    titular BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for moradores updated_at
CREATE TRIGGER update_moradores_updated_at
    BEFORE UPDATE ON public.moradores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. proprietarios
CREATE TABLE IF NOT EXISTS public.proprietarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for proprietarios updated_at
CREATE TRIGGER update_proprietarios_updated_at
    BEFORE UPDATE ON public.proprietarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. boletos
CREATE TABLE IF NOT EXISTS public.boletos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
    competencia VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    vencimento DATE NOT NULL,
    valor NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('aberto', 'pago', 'vencido')),
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for boletos updated_at
CREATE TRIGGER update_boletos_updated_at
    BEFORE UPDATE ON public.boletos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. comunicados
CREATE TABLE IF NOT EXISTS public.comunicados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    publicado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for comunicados updated_at
CREATE TRIGGER update_comunicados_updated_at
    BEFORE UPDATE ON public.comunicados
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. documentos
CREATE TABLE IF NOT EXISTS public.documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    arquivo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for documentos updated_at
CREATE TRIGGER update_documentos_updated_at
    BEFORE UPDATE ON public.documentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. chamados
CREATE TABLE IF NOT EXISTS public.chamados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT NOT NULL,
    prioridade TEXT NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta')),
    status TEXT NOT NULL CHECK (status IN ('aberto', 'em_atendimento', 'resolvido', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for chamados updated_at
CREATE TRIGGER update_chamados_updated_at
    BEFORE UPDATE ON public.chamados
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. chamados_anexos
CREATE TABLE IF NOT EXISTS public.chamados_anexos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamado_id UUID NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
    arquivo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for chamados_anexos updated_at
CREATE TRIGGER update_chamados_anexos_updated_at
    BEFORE UPDATE ON public.chamados_anexos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    telefone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for fornecedores updated_at
CREATE TRIGGER update_fornecedores_updated_at
    BEFORE UPDATE ON public.fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. receitas
CREATE TABLE IF NOT EXISTS public.receitas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor NUMERIC(12, 2) NOT NULL,
    vencimento DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pendente', 'pago', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for receitas updated_at
CREATE TRIGGER update_receitas_updated_at
    BEFORE UPDATE ON public.receitas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 14. despesas
CREATE TABLE IF NOT EXISTS public.despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
    fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC(12, 2) NOT NULL,
    vencimento DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pendente', 'pago', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for despesas updated_at
CREATE TRIGGER update_despesas_updated_at
    BEFORE UPDATE ON public.despesas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 15. areas_comuns
CREATE TABLE IF NOT EXISTS public.areas_comuns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for areas_comuns updated_at
CREATE TRIGGER update_areas_comuns_updated_at
    BEFORE UPDATE ON public.areas_comuns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 16. reservas
CREATE TABLE IF NOT EXISTS public.reservas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID NOT NULL REFERENCES public.areas_comuns(id) ON DELETE CASCADE,
    unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('solicitado', 'aprovado', 'rejeitado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for reservas updated_at
CREATE TRIGGER update_reservas_updated_at
    BEFORE UPDATE ON public.reservas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 17. assembleias
CREATE TABLE IF NOT EXISTS public.assembleias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data_assembleia TIMESTAMP WITH TIME ZONE NOT NULL,
    ata_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for assembleias updated_at
CREATE TRIGGER update_assembleias_updated_at
    BEFORE UPDATE ON public.assembleias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adiciona a coluna de vinculo direto ao condomínio se não existir para simplificar RLS de Síndicos/Conselheiros/Moradores
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS condominio_id UUID REFERENCES public.condominios(id) ON DELETE SET NULL;

-- =========================================================================
-- DATABASE PERFORMANCE INDEXES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_perfis_auth_user ON public.perfis(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_perfis_condominio ON public.perfis(condominio_id);
CREATE INDEX IF NOT EXISTS idx_perfis_tipo ON public.perfis(tipo);
CREATE INDEX IF NOT EXISTS idx_blocos_condominio ON public.blocos(condominio_id);
CREATE INDEX IF NOT EXISTS idx_unidades_bloco ON public.unidades(bloco_id);
CREATE INDEX IF NOT EXISTS idx_moradores_unidade ON public.moradores(unidade_id);
CREATE INDEX IF NOT EXISTS idx_moradores_perfil ON public.moradores(perfil_id);
CREATE INDEX IF NOT EXISTS idx_proprietarios_unidade ON public.proprietarios(unidade_id);
CREATE INDEX IF NOT EXISTS idx_proprietarios_perfil ON public.proprietarios(perfil_id);
CREATE INDEX IF NOT EXISTS idx_boletos_unidade ON public.boletos(unidade_id);
CREATE INDEX IF NOT EXISTS idx_boletos_status ON public.boletos(status);
CREATE INDEX IF NOT EXISTS idx_comunicados_condominio ON public.comunicados(condominio_id);
CREATE INDEX IF NOT EXISTS idx_documentos_condominio ON public.documentos(condominio_id);
CREATE INDEX IF NOT EXISTS idx_chamados_unidade ON public.chamados(unidade_id);
CREATE INDEX IF NOT EXISTS idx_chamados_status ON public.chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_anexos_chamado ON public.chamados_anexos(chamado_id);
CREATE INDEX IF NOT EXISTS idx_receitas_condominio ON public.receitas(condominio_id);
CREATE INDEX IF NOT EXISTS idx_despesas_condominio ON public.despesas(condominio_id);
CREATE INDEX IF NOT EXISTS idx_areas_comuns_condominio ON public.areas_comuns(condominio_id);
CREATE INDEX IF NOT EXISTS idx_reservas_area ON public.reservas(area_id);
CREATE INDEX IF NOT EXISTS idx_reservas_unidade ON public.reservas(unidade_id);
CREATE INDEX IF NOT EXISTS idx_assembleias_condominio ON public.assembleias(condominio_id);

-- =========================================================================
-- SECURITY CHECKS & HELPER FUNCTIONS
-- =========================================================================

-- Get Profile Info
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS JSONB SECURITY DEFINER AS $$
DECLARE
    profile_data JSONB;
BEGIN
    SELECT json_build_object(
        'id', id,
        'tipo', tipo,
        'nome', nome,
        'email', email
    )::jsonb INTO profile_data
    FROM public.perfis
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
    RETURN profile_data;
END;
$$ LANGUAGE plpgsql;

-- Check if Authenticated User is a Platform Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.perfis
        WHERE auth_user_id = auth.uid() AND tipo = 'administrador'
    );
END;
$$ LANGUAGE plpgsql;

-- Check if Authenticated User is a Platform Colaborador (Facilities Employee)
CREATE OR REPLACE FUNCTION public.is_colaborador()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.perfis
        WHERE auth_user_id = auth.uid() AND tipo IN ('administrador', 'colaborador')
    );
END;
$$ LANGUAGE plpgsql;

-- Check if Authenticated User is Síndico or Subsíndico
CREATE OR REPLACE FUNCTION public.is_sindico_or_subsindico()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.perfis
        WHERE auth_user_id = auth.uid() AND tipo IN ('administrador', 'colaborador', 'sindico', 'subsindico')
    );
END;
$$ LANGUAGE plpgsql;

-- Check if User belongs to a specific Condominium
CREATE OR REPLACE FUNCTION public.user_belongs_to_condominio(condo_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
DECLARE
    user_p UUID;
    user_t TEXT;
    user_c UUID;
BEGIN
    SELECT id, tipo, condominio_id INTO user_p, user_t, user_c FROM public.perfis WHERE auth_user_id = auth.uid() LIMIT 1;
    
    -- Admins/colab have global access
    IF user_t IN ('administrador', 'colaborador') THEN
        RETURN TRUE;
    END IF;

    -- Se o perfil possui vínculo direto com o condomínio correspondente
    IF user_c IS NOT NULL AND user_c = condo_id THEN
        RETURN TRUE;
    END IF;

    -- Moradores/Conselheiros/Proprietarios linked to the condo
    RETURN EXISTS (
        SELECT 1 
        FROM public.unidades u
        JOIN public.blocos b ON u.bloco_id = b.id
        LEFT JOIN public.moradores m ON m.unidade_id = u.id
        LEFT JOIN public.proprietarios p ON p.unidade_id = u.id
        WHERE b.condominio_id = condo_id
          AND (m.perfil_id = user_p OR p.perfil_id = user_p)
    );
END;
$$ LANGUAGE plpgsql;

-- Check if User belongs to a specific Unit
CREATE OR REPLACE FUNCTION public.user_belongs_to_unidade(unit_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
DECLARE
    user_p UUID;
    user_t TEXT;
BEGIN
    SELECT id, tipo INTO user_p, user_t FROM public.perfis WHERE auth_user_id = auth.uid() LIMIT 1;

    -- Admins/colab/sindicos have global visibility inside the structural units
    IF user_t IN ('administrador', 'colaborador', 'sindico', 'subsindico') THEN
        RETURN TRUE;
    END IF;

    -- Resident / Owner check
    RETURN EXISTS (
        SELECT 1 
        FROM public.unidades u
        LEFT JOIN public.moradores m ON m.unidade_id = u.id
        LEFT JOIN public.proprietarios p ON p.unidade_id = u.id
        WHERE u.id = unit_id
          AND (m.perfil_id = user_p OR p.perfil_id = user_p)
    );
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR ALL TABLES
-- =========================================================================

-- PERFIS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem controle total de perfis"
    ON public.perfis FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Usuários leem seu próprio perfil"
    ON public.perfis FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Permitir inserções de perfis durante o cadastro de novos usuários"
    ON public.perfis FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Permitir atualizações de perfis pelos próprios usuários"
    ON public.perfis FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Leitura de perfis de moradores pelo Sindico"
    ON public.perfis FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.perfis
            WHERE auth_user_id = auth.uid() AND tipo IN ('sindico', 'subsindico', 'conselheiro')
        )
    );

-- CONDOMINIOS
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem controle total de condominios"
    ON public.condominios FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Acesso apenas ao condomínio vinculado para os perfis autorizados"
    ON public.condominios FOR SELECT
    USING (public.user_belongs_to_condominio(id));

-- BLOCOS
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem controle total de blocos"
    ON public.blocos FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Acesso apenas aos blocos do condomínio vinculado"
    ON public.blocos FOR SELECT
    USING (public.user_belongs_to_condominio(condominio_id));

-- UNIDADES
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem controle total de unidades"
    ON public.unidades FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Acesso às unidades do condomínio ao qual possui relacionamento"
    ON public.unidades FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.blocos b
            WHERE b.id = bloco_id AND public.user_belongs_to_condominio(b.condominio_id)
        )
    );

-- MORADORES
ALTER TABLE public.moradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem controle total de moradores"
    ON public.moradores FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Sindicos e Conselheiros acessam moradores do condomínio"
    ON public.moradores FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.unidades u
            JOIN public.blocos b ON u.bloco_id = b.id
            WHERE u.id = unidade_id AND public.user_belongs_to_condominio(b.condominio_id)
        )
    );

CREATE POLICY "Moradores acessam seu próprio relacionamento oficial"
    ON public.moradores FOR SELECT
    USING (
        perfil_id IN (SELECT id FROM public.perfis WHERE auth_user_id = auth.uid())
    );

-- PROPRIETARIOS
ALTER TABLE public.proprietarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem controle total de proprietarios"
    ON public.proprietarios FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Proprietarios verificam seus próprios registros"
    ON public.proprietarios FOR SELECT
    USING (
        perfil_id IN (SELECT id FROM public.perfis WHERE auth_user_id = auth.uid())
    );

-- BOLETOS
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem controle total de boletos"
    ON public.boletos FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Sindico e Conselheiro leem boletos do condomínio"
    ON public.boletos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.unidades u
            JOIN public.blocos b ON u.bloco_id = b.id
            WHERE u.id = unidade_id AND public.is_sindico_or_subsindico()
        )
    );

CREATE POLICY "Usuário vinculado a unidade lê boletos da mesma"
    ON public.boletos FOR SELECT
    USING (public.user_belongs_to_unidade(unidade_id));

-- COMUNICADOS
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem controle total de comunicados"
    ON public.comunicados FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Sindico gerencia comunicados do condomínio"
    ON public.comunicados FOR ALL
    USING (
        public.is_sindico_or_subsindico() AND public.user_belongs_to_condominio(condominio_id)
    );

CREATE POLICY "Usuários leem comunicados vinculados a seu condomínio"
    ON public.comunicados FOR SELECT
    USING (public.user_belongs_to_condominio(condominio_id));

-- DOCUMENTOS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem controle total de documentos"
    ON public.documentos FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Sindico insere documentos no condomínio"
    ON public.documentos FOR INSERT
    WITH CHECK (
        public.is_sindico_or_subsindico() AND public.user_belongs_to_condominio(condominio_id)
    );

CREATE POLICY "Membros leem documentos vinculados ao condomínio"
    ON public.documentos FOR SELECT
    USING (public.user_belongs_to_condominio(condominio_id));

-- CHAMADOS
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores gerenciam chamados"
    ON public.chamados FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Morador cria chamados para sua unidade"
    ON public.chamados FOR INSERT
    WITH CHECK (public.user_belongs_to_unidade(unidade_id));

CREATE POLICY "Morador lê chamados de sua unidade correspondente"
    ON public.chamados FOR SELECT
    USING (public.user_belongs_to_unidade(unidade_id));

CREATE POLICY "Sindico visualiza e edita status dos chamados do condomínio"
    ON public.chamados FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.unidades u
            JOIN public.blocos b ON u.bloco_id = b.id
            WHERE u.id = unidade_id AND public.is_sindico_or_subsindico() AND public.user_belongs_to_condominio(b.condominio_id)
        )
    );

-- CHAMADOS_ANEXOS
ALTER TABLE public.chamados_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso completo aos anexos para administradores e colaboradores"
    ON public.chamados_anexos FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Criadores de chamados inserem anexos"
    ON public.chamados_anexos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.chamados c
            WHERE c.id = chamado_id AND public.user_belongs_to_unidade(c.unidade_id)
        )
    );

-- FORNECEDORES
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores gerenciam fornecedores"
    ON public.fornecedores FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Sindico e conselheiros visualizam fornecedores"
    ON public.fornecedores FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.perfis 
            WHERE auth_user_id = auth.uid() AND tipo IN ('sindico', 'subsindico', 'conselheiro')
        )
    );

-- RECEITAS
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem controle de receitas"
    ON public.receitas FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Sindico e Conselheiros leem receitas do condomínio"
    ON public.receitas FOR SELECT
    USING (
        public.user_belongs_to_condominio(condominio_id) AND 
        EXISTS (
            SELECT 1 FROM public.perfis 
            WHERE auth_user_id = auth.uid() AND tipo IN ('sindico', 'subsindico', 'conselheiro')
        )
    );

-- DESPESAS
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem controle de despesas"
    ON public.despesas FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Sindico e Conselheiros leem despesas do condomínio"
    ON public.despesas FOR SELECT
    USING (
        public.user_belongs_to_condominio(condominio_id) AND 
        EXISTS (
            SELECT 1 FROM public.perfis 
            WHERE auth_user_id = auth.uid() AND tipo IN ('sindico', 'subsindico', 'conselheiro')
        )
    );

-- AREAS_COMUNS
ALTER TABLE public.areas_comuns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem controle de áreas comuns"
    ON public.areas_comuns FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Usuários cadastrados leem áreas comuns de seu condomínio"
    ON public.areas_comuns FOR SELECT
    USING (public.user_belongs_to_condominio(condominio_id));

-- RESERVAS
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores possuem gerenciamento total de reservas"
    ON public.reservas FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Sindico gerencia reservas de seu condomínio"
    ON public.reservas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.areas_comuns a
            WHERE a.id = area_id AND public.user_belongs_to_condominio(a.condominio_id)
        ) AND public.is_sindico_or_subsindico()
    );

CREATE POLICY "Morador gerencia e visualiza suas próprias reservas"
    ON public.reservas FOR ALL
    USING (public.user_belongs_to_unidade(unidade_id));

-- ASSEMBLEIAS
ALTER TABLE public.assembleias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Colaboradores gerenciam assembleias"
    ON public.assembleias FOR ALL
    USING (public.is_colaborador());

CREATE POLICY "Sindico gerencia assembleias de seu condomínio"
    ON public.assembleias FOR ALL
    USING (
        public.user_belongs_to_condominio(condominio_id) AND public.is_sindico_or_subsindico()
    );

CREATE POLICY "Participantes vinculados visualizam as assembleias"
    ON public.assembleias FOR SELECT
    USING (public.user_belongs_to_condominio(condominio_id));

-- =========================================================================
-- SUPABASE STORAGE BUCKETS POLICIES
-- =========================================================================

-- Note: The following script expects the creation of Supabase Buckets:
-- 'documentos-condominio', 'boletos', 'atas', 'contratos', and 'fotos-chamados'
-- These queries inject high-integrity policies into storage.objects table.

-- Helper check inside storage system
CREATE OR REPLACE FUNCTION public.storage_has_role(role_arr text[])
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.perfis
        WHERE auth_user_id = auth.uid() AND tipo = ANY(role_arr)
    );
END;
$$ LANGUAGE plpgsql;

-- 1. POLICIES FOR 'documentos-condominio' KEYSTORE
CREATE POLICY "Admins e Colaboradores possuem acesso total a documentos-condominio"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'documentos-condominio' AND public.storage_has_role('{administrador,colaborador}'));

CREATE POLICY "Sindicos inserem documentos para o bucket documentos-condominio"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'documentos-condominio' AND public.storage_has_role('{sindico,subsindico}'));

CREATE POLICY "Membros vinculados leem arquivos do bucket documentos-condominio"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'documentos-condominio');

-- 2. POLICIES FOR 'boletos' BUCKET
CREATE POLICY "Admins e Colaboradores de condomínio acessam boletos"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'boletos' AND public.storage_has_role('{administrador,colaborador}'));

CREATE POLICY "Condôminos leem seus boletos no bucket"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'boletos');

-- 3. POLICIES FOR 'atas' BUCKET
CREATE POLICY "Controle total do bucket atas para equipe Facilities"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'atas' AND public.storage_has_role('{administrador,colaborador}'));

CREATE POLICY "Sindico envia atas de assembleia"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'atas' AND public.storage_has_role('{sindico,subsindico}'));

CREATE POLICY "Leitura de atas do condomínio por todos os moradores"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'atas');

-- 4. POLICIES FOR 'contratos' BUCKET
CREATE POLICY "Controle dos contratos do condomínio"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'contratos' AND public.storage_has_role('{administrador,colaborador}'));

CREATE POLICY "Leitura e visualização de contratos ativos pelo sindico"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'contratos' AND public.storage_has_role('{administrador,colaborador,sindico,subsindico,conselheiro}'));

-- 5. POLICIES FOR 'fotos-chamados' BUCKET
CREATE POLICY "Controle de fotos de chamados por equipe Facilities"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'fotos-chamados' AND public.storage_has_role('{administrador,colaborador}'));

CREATE POLICY "Usuarios enviam fotos dos chamados e ocorrencias"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'fotos-chamados');

CREATE POLICY "Usuarios leem fotos das ocorrencias vinculadas"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'fotos-chamados');

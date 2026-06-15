import { createClient } from '@supabase/supabase-js';

// Load and sanitize Supabase configuration with recursive quote stripping
const cleanEnvVar = (val: string): string => {
  let cleaned = (val || '').trim();
  
  // Recursively clean up wrapping quotes of any kind (single, double, backticks)
  while (
    cleaned.startsWith('"') || 
    cleaned.endsWith('"') || 
    cleaned.startsWith("'") || 
    cleaned.endsWith("'") ||
    cleaned.startsWith('`') ||
    cleaned.endsWith('`')
  ) {
    if (cleaned.startsWith('"')) cleaned = cleaned.substring(1);
    if (cleaned.endsWith('"')) cleaned = cleaned.substring(0, cleaned.length - 1);
    if (cleaned.startsWith("'")) cleaned = cleaned.substring(1);
    if (cleaned.endsWith("'")) cleaned = cleaned.substring(0, cleaned.length - 1);
    if (cleaned.startsWith('`')) cleaned = cleaned.substring(1);
    if (cleaned.endsWith('`')) cleaned = cleaned.substring(0, cleaned.length - 1);
    cleaned = cleaned.trim();
  }
  return cleaned;
};

// First try to load from localStorage (supports overriding directly in Web UI)
const getStorageVal = (key: string): string => {
  try {
    return typeof localStorage !== 'undefined' ? (localStorage.getItem(key) || '') : '';
  } catch (e) {
    return '';
  }
};

const rawUrl = getStorageVal('VITE_SUPABASE_URL') || 
               import.meta.env.VITE_SUPABASE_URL || 
               (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') || '';
const rawKey = getStorageVal('VITE_SUPABASE_ANON_KEY') || 
                import.meta.env.VITE_SUPABASE_ANON_KEY || 
                (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '') || '';

export const supabaseUrl = cleanEnvVar(rawUrl).replace(/\/$/, ''); // Remove trailing slashes
export const supabaseAnonKey = cleanEnvVar(rawKey);

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-public-key' &&
  !supabaseUrl.includes('placeholder-project-id') &&
  !supabaseAnonKey.includes('placeholder-anon-key')
);

// Safe console diagnostics to help debug without exposing secret keys
console.log('=== Supabase Config Diagnostics ===', {
  isConfigured: isSupabaseConfigured,
  hasUrl: !!supabaseUrl,
  urlSample: supabaseUrl ? (supabaseUrl.length > 15 ? supabaseUrl.substring(0, 15) + '...' : supabaseUrl) : 'none',
  urlLength: supabaseUrl ? supabaseUrl.length : 0,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
  viteKeys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
});

// Gracefully initialize Supabase client or fallback to placeholder strings to prevent typescript null errors
const finalUrl = isSupabaseConfigured && supabaseUrl ? supabaseUrl : 'https://placeholder-project-id.supabase.co';
const finalKey = isSupabaseConfigured && supabaseAnonKey ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(finalUrl, finalKey);

// Simulated storage handlers for when Supabase is not configured yet
export const getSimulatedData = <T>(key: string): T[] => {
  const data = localStorage.getItem(`supabase_sim_${key}`);
  return data ? JSON.parse(data) : [];
};

export const saveSimulatedData = <T>(key: string, item: T): void => {
  const current = getSimulatedData<T>(key);
  localStorage.setItem(`supabase_sim_${key}`, JSON.stringify([item, ...current]));
};

// Resilient insert helper - filters out missing columns on the fly if they don't exist in Supabase
export async function insertResilient(tableName: string, record: Record<string, any>) {
  console.log(`%c[Supabase INSERT] 🚀 Iniciando fluxo de cadastro na tabela '${tableName}'...`, 'color: #3ecf8e; font-weight: bold; font-size: 14px; background-color: #101c29; padding: 4px 8px; border-radius: 4px;');
  console.log(`[Supabase INSERT] 📥 Dados originais enviados pelo formulário:`, JSON.stringify(record, null, 2));

  if (!isSupabaseConfigured || !supabase) {
    const backupError = new Error('Supabase de teste não está configurado. O sistema usará gravação local/simulada.');
    console.warn('[Supabase INSERT] ⚠️ Redirecionado para Simulação Local:', backupError.message);
    return { data: null, error: backupError };
  }

  let currentRecord = { ...record };
  let attempts = 0;
  const maxAttempts = 15;

  while (attempts < maxAttempts) {
    console.log(`[Supabase INSERT] 🔄 Tentativa #${attempts + 1} de gravação na tabela '${tableName}'...`);
    console.log(`[Supabase INSERT] 📦 Payload enviado nesta tentativa:`, JSON.stringify(currentRecord, null, 2));

    const { data: dbData, error } = await supabase.from(tableName).insert(currentRecord).select();
    
    if (!error) {
      console.log(`%c[Supabase INSERT] ✅ SUCESSO! Cadastro efetuado com êxito na tabela '${tableName}' na tentativa #${attempts + 1}!`, 'color: #10b981; font-weight: bold; font-size: 13px;');
      console.log(`[Supabase INSERT] 🎉 Resultado do INSERT:`, {
        status: 'Gravado',
        record: currentRecord,
        data: dbData
      });
      return { data: dbData || [currentRecord], error: null };
    }

    console.warn(`%c[Supabase INSERT] ❌ FALHA na tentativa #${attempts + 1} para tabela '${tableName}':`, 'color: #f59e0b; font-weight: bold;');
    console.warn(`[Supabase INSERT] Código de Erro:`, error.code);
    console.warn(`[Supabase INSERT] Mensagem de Erro:`, error.message);
    console.warn(`[Supabase INSERT] Objeto do Erro Completo:`, error);

    // PostgreSQL undefined_column code "42703" or PostgREST schema cache missing column error.
    const isMissingColumnError = 
      error.code === '42703' || 
      (error.message && error.message.includes('column') && error.message.includes('does not exist')) ||
      (error.message && error.message.includes('não existe')) ||
      (error.message && error.message.includes('schema cache')) ||
      (error.message && error.message.includes('Could not find') && error.message.includes('column'));

    if (isMissingColumnError) {
      // Extract column name, e.g. column "sindico" of relation "condominios" does not exist OR Could not find the 'despesa' column...
      const match = error.message.match(/column "([^"]+)"/i) || 
                    error.message.match(/coluna "([^"]+)"/i) ||
                    error.message.match(/Could not find the '([^']+)' column/i) ||
                    error.message.match(/column '([^']+)'/i);
      
      if (match && match[1]) {
        const missingColumn = match[1];
        console.log(`%c[Supabase INSERT] 🛠️ Autocorreção: Detectado que a coluna '${missingColumn}' não existe no banco ou está ausente no cache do Supabase. Removendo dos dados e redefinindo envio...`, 'color: #3b82f6; font-weight: bold;');
        delete currentRecord[missingColumn];
        attempts++;
        continue;
      } else {
        // Se não conseguirmos extrair com regex, vamos tentar adivinhar a partir de conhecidos
        let cleanedSome = false;
        const knownFields = Object.keys(currentRecord);
        for (const field of knownFields) {
          if (error.message.toLowerCase().includes(field.toLowerCase())) {
            console.log(`%c[Supabase INSERT] 🛠️ Autocorreção Fallback: Encontrado termo '${field}' no erro do Supabase. Removendo do envio...`, 'color: #3b82f6;');
            delete currentRecord[field];
            cleanedSome = true;
          }
        }
        
        if (cleanedSome) {
          attempts++;
          continue;
        }
      }
    }
    
    // Otherwise return error
    console.error(`%c[Supabase INSERT] 🛑 ERRO DEFINITIVO de gravação na tabela '${tableName}'! Fluxo interrompido devido a erro crítico:`, 'color: #ef4444; font-weight: bold; font-size: 13px;');
    console.error(`[Supabase INSERT] Mensagem final retornada pelo Supabase:`, error.message);
    return { data: null, error };
  }

  const limitError = new Error('Resilient insert limits exceeded.');
  console.error('[Supabase INSERT] 🛑 ERRO DEFINITIVO:', limitError.message);
  return { data: null, error: limitError };
}

// Resilient update helper - filters out missing columns on the fly if they don't exist in Supabase during update
export async function updateResilient(tableName: string, id: string, record: Record<string, any>) {
  console.log(`%c[Supabase UPDATE] 🚀 Iniciando fluxo de atualização na tabela '${tableName}' para ID ${id}...`, 'color: #3ecf8e; font-weight: bold; font-size: 14px; background-color: #101c29; padding: 4px 8px; border-radius: 4px;');
  console.log(`[Supabase UPDATE] 📥 Dados originais enviados para alteração:`, JSON.stringify(record, null, 2));

  if (!isSupabaseConfigured || !supabase) {
    const backupError = new Error('Supabase de teste não está configurado. O sistema usará alteração local/simulada.');
    console.warn('[Supabase UPDATE] ⚠️ Redirecionado para Simulação Local:', backupError.message);
    return { data: null, error: backupError };
  }

  let currentRecord = { ...record };
  // Never update the ID field
  delete currentRecord.id;
  
  let attempts = 0;
  const maxAttempts = 15;

  while (attempts < maxAttempts) {
    console.log(`[Supabase UPDATE] 🔄 Tentativa #${attempts + 1} de alteração na tabela '${tableName}'...`);
    console.log(`[Supabase UPDATE] 📦 Payload de atualização enviado:`, JSON.stringify(currentRecord, null, 2));

    const { data: dbData, error } = await supabase.from(tableName).update(currentRecord).eq('id', id).select();
    
    if (!error) {
      console.log(`%c[Supabase UPDATE] ✅ SUCESSO! Alteração efetuada com êxito na tabela '${tableName}' para ID ${id}!`, 'color: #10b981; font-weight: bold; font-size: 13px;');
      return { data: dbData || [currentRecord], error: null };
    }

    console.warn(`%c[Supabase UPDATE] ❌ FALHA na tentativa #${attempts + 1} para tabela '${tableName}':`, 'color: #f59e0b; font-weight: bold;');
    console.warn(`[Supabase UPDATE] Código de Erro:`, error.code);
    console.warn(`[Supabase UPDATE] Mensagem de Erro:`, error.message);
    console.warn(`[Supabase UPDATE] Objeto do Erro Completo:`, error);

    // PostgreSQL undefined_column code "42703" or PostgREST schema cache missing column error.
    const isMissingColumnError = 
      error.code === '42703' || 
      (error.message && error.message.includes('column') && error.message.includes('does not exist')) ||
      (error.message && error.message.includes('não existe')) ||
      (error.message && error.message.includes('schema cache')) ||
      (error.message && error.message.includes('Could not find') && error.message.includes('column'));

    if (isMissingColumnError) {
      const match = error.message.match(/column "([^"]+)"/i) || 
                    error.message.match(/coluna "([^"]+)"/i) ||
                    error.message.match(/Could not find the '([^']+)' column/i) ||
                    error.message.match(/column '([^']+)'/i);
      
      if (match && match[1]) {
        const missingColumn = match[1];
        console.log(`%c[Supabase UPDATE] 🛠️ Autocorreção: Detectado que a coluna '${missingColumn}' não existe ou está ausente no cache. Removendo dos dados de atualização...`, 'color: #3b82f6; font-weight: bold;');
        delete currentRecord[missingColumn];
        attempts++;
        continue;
      } else {
        let cleanedSome = false;
        const knownFields = Object.keys(currentRecord);
        for (const field of knownFields) {
          if (error.message.toLowerCase().includes(field.toLowerCase())) {
            console.log(`%c[Supabase UPDATE] 🛠️ Autocorreção Fallback: Encontrado termo '${field}' no erro. Removendo do envio...`, 'color: #3b82f6;');
            delete currentRecord[field];
            cleanedSome = true;
          }
        }
        
        if (cleanedSome) {
          attempts++;
          continue;
        }
      }
    }
    
    console.error(`%c[Supabase UPDATE] 🛑 ERRO DEFINITIVO de alteração na tabela '${tableName}'! Fluxo interrompido devido a erro crítico:`, 'color: #ef4444; font-weight: bold; font-size: 13px;');
    console.error(`[Supabase UPDATE] Mensagem final retornada pelo Supabase:`, error.message);
    return { data: null, error };
  }

  const limitError = new Error('Resilient update limits exceeded.');
  console.error('[Supabase UPDATE] 🛑 ERRO DEFINITIVO:', limitError.message);
  return { data: null, error: limitError };
}

// SQL helper pattern for tables creation
export const SQL_SETUP_SCRIPT = `-- EXECUTE ESTE SCRIPT NO EDITOR SQL DO SEU PAINEL SUPABASE:

-- 1. Tabela de Mensagens de Contato
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  mensagem TEXT,
  data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Propostas / Orçamentos
CREATE TABLE IF NOT EXISTS quote_requests (
  id TEXT PRIMARY KEY,
  condominio_nome TEXT NOT NULL,
  endereco TEXT,
  unidades INTEGER,
  contato_nome TEXT NOT NULL,
  contato_email TEXT NOT NULL,
  contato_telefone TEXT,
  cargo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Reservas de Lazer
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  area TEXT NOT NULL,
  data TEXT NOT NULL,
  periodo TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Ocorrências / Chamados
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_criacao TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Perfis de Usuários (Tabela Única 'perfil' conforme solicitado)
CREATE TABLE IF NOT EXISTS perfil (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT,
  tipo TEXT NOT NULL, -- administrador, colaborador, sindico, etc. (Vinculado a 'tipos_perfil')
  unidade TEXT,
  sobrenome TEXT,
  apelido TEXT,
  foto_perfil TEXT,
  telefone TEXT,
  whatsapp TEXT,
  ativo BOOLEAN DEFAULT true,
  condominio_id TEXT,
  status_convite TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garante que todas as colunas existem na tabela 'perfil' (singular)
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
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS status_convite TEXT;

-- 5b. Tabela para os Tipos de Perfis (Roles) para o Admin adicionar, editar e cancelar
CREATE TABLE IF NOT EXISTS tipos_perfil (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- Identificador da role (ex: 'administrador', 'sindico', 'morador')
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Populando com as opções padrões iniciais de tipos de perfis
INSERT INTO public.tipos_perfil (nome, slug, descricao) VALUES
  ('Administrador', 'administrador', 'Controle Total Master'),
  ('Síndico', 'sindico', 'Gestor Geral do Condomínio'),
  ('Morador', 'morador', 'Apenas Consulta e Unidade'),
  ('Proprietário', 'proprietario', 'Condômino Donatário'),
  ('Subsíndico', 'subsindico', 'Apoio Setorial de Gestão'),
  ('Conselheiro', 'conselheiro', 'Fiscal e Auditor Read-Only'),
  ('Porteiro', 'porteiro', 'Controle de Acesso de Portaria'),
  ('Colaborador', 'colaborador', 'Prestador Interno')
ON CONFLICT (slug) DO NOTHING;

-- Remove a tabela física 'perfis' (caso exista) pois AGORA TEMOS APENAS A 'perfil' para cadastros
DROP TABLE IF EXISTS public.perfis CASCADE;

-- Criamos a VIEW 'perfis' apontando para 'perfil' para manter total retrocompatibilidade no frontend
CREATE OR REPLACE VIEW public.perfis AS
SELECT 
  id,
  id AS auth_user_id,
  nome,
  cpf,
  email,
  unidade,
  tipo,
  tipo AS perfil,
  created_at AS data_cadastro,
  sobrenome,
  apelido,
  foto_perfil,
  whatsapp,
  telefone,
  ativo,
  condominio_id
FROM public.perfil;

-- 6. Tabela de Condomínios
CREATE TABLE IF NOT EXISTS condominios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  sindico TEXT,
  unidades INTEGER,
  moradores INTEGER DEFAULT 0,
  proprietarios INTEGER DEFAULT 0,
  receita NUMERIC DEFAULT 0,
  despesa NUMERIC DEFAULT 0,
  inadimplencia_percent NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE condominios ADD COLUMN IF NOT EXISTS bairro TEXT;

-- 7. Tabela de Moradores
CREATE TABLE IF NOT EXISTS moradores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT,
  email TEXT,
  unidade TEXT,
  condominio_id TEXT,
  proprietario BOOLEAN DEFAULT true,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garante que todas as colunas existem na tabela 'moradores' caso ela já existisse sem alguma delas
ALTER TABLE public.moradores ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.moradores ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.moradores ADD COLUMN IF NOT EXISTS unidade TEXT;
ALTER TABLE public.moradores ADD COLUMN IF NOT EXISTS condominio_id TEXT;
ALTER TABLE public.moradores ADD COLUMN IF NOT EXISTS proprietario BOOLEAN DEFAULT true;
ALTER TABLE public.moradores ADD COLUMN IF NOT EXISTS telefone TEXT;

-- 7b. Tabela de Síndicos (Cadastrados/Vinculados aos condomínios)
CREATE TABLE IF NOT EXISTS sindico (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  sobrenome TEXT,
  apelido TEXT,
  cpf TEXT,
  foto_url TEXT,
  telefone TEXT,
  whatsapp TEXT,
  condominio_id TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garante que todas as colunas existem na tabela 'sindico' caso ela já existisse sem alguma delas
ALTER TABLE public.sindico ADD COLUMN IF NOT EXISTS sobrenome TEXT;
ALTER TABLE public.sindico ADD COLUMN IF NOT EXISTS apelido TEXT;
ALTER TABLE public.sindico ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.sindico ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.sindico ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.sindico ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.sindico ADD COLUMN IF NOT EXISTS condominio_id TEXT;
ALTER TABLE public.sindico ADD COLUMN IF NOT EXISTS email TEXT;

-- 8. Tabela de Visitantes
CREATE TABLE IF NOT EXISTS visitantes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  rg TEXT,
  unidade TEXT,
  condominio_id TEXT,
  data_entrada TEXT,
  status TEXT DEFAULT 'Liberado',
  data_saida TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Tabela de Encomendas
CREATE TABLE IF NOT EXISTS encomendas (
  id TEXT PRIMARY KEY,
  destinatario TEXT NOT NULL,
  unidade TEXT,
  condominio_id TEXT,
  descricao TEXT,
  transportadora TEXT,
  data_registro TEXT,
  status TEXT DEFAULT 'Aguardando',
  data_retirada TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Tabela de Auditoria (Logs)
CREATE TABLE IF NOT EXISTS auditoria (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  hora TEXT NOT NULL,
  quem TEXT NOT NULL,
  perfil TEXT NOT NULL,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  detalhes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Tabela de Boletos Bancários
CREATE TABLE IF NOT EXISTS boletos (
  id TEXT PRIMARY KEY,
  referencia TEXT NOT NULL,
  vencimento TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pendente',
  codigo_barras TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Tabela de Assembleias
CREATE TABLE IF NOT EXISTS assemblies (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  data TEXT NOT NULL,
  hora TEXT NOT NULL,
  pauta TEXT NOT NULL,
  votacao_ativa BOOLEAN DEFAULT true,
  pergunta_votacao TEXT,
  votos_favor INTEGER DEFAULT 0,
  votos_contra INTEGER DEFAULT 0,
  voto_usuario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar acesso público de escrita nas tabelas para habilitar leads via formulários do site
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir inserções públicas" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir leitura pública temporária" ON contact_messages FOR SELECT USING (true);

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir inserções públicas" ON quote_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir leitura pública temporária" ON quote_requests FOR SELECT USING (true);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para simulação" ON bookings FOR ALL USING (true);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para simulação" ON tickets FOR ALL USING (true);

ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para simulação de condominios" ON condominios FOR ALL USING (true);

ALTER TABLE moradores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para simulação de moradores" ON moradores FOR ALL USING (true);

ALTER TABLE visitantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para simulação de visitantes" ON visitantes FOR ALL USING (true);

ALTER TABLE encomendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para simulação de encomendas" ON encomendas FOR ALL USING (true);

ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para simulação de auditoria" ON auditoria FOR ALL USING (true);

ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para simulação de boletos" ON boletos FOR ALL USING (true);

ALTER TABLE assemblies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para simulação de assemblies" ON assemblies FOR ALL USING (true);

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE sindico ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 13. FUNÇÕES DE APOIO PARA RLS (ROW LEVEL SECURITY) E VALIDAÇÃO DE CARGO
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_user_type(user_id uuid)
RETURNS text AS $$
DECLARE
  v_tipo text;
BEGIN
  -- Tenta buscar o tipo de usuário na tabela perfil
  SELECT tipo INTO v_tipo FROM public.perfil WHERE id = user_id;
  RETURN COALESCE(v_tipo, 'morador');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_type(user_id) IN ('administrador', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_colaborador(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_type(user_id) = 'colaborador';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_sindico(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_type(user_id) = 'sindico';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_morador(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_type(user_id) IN ('morador', 'proprietario');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_user_active(user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_ativo boolean;
BEGIN
  SELECT COALESCE(ativo, true) INTO v_ativo FROM public.perfil WHERE id = user_id;
  RETURN COALESCE(v_ativo, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================================
-- 14. VIEW 'profiles' UNIFICANDO USUÁRIOS AUTH COM MORADORES, SÍNDICOS E ADMINS
-- ==========================================================================
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
  u.id AS id,
  u.email AS email,
  COALESCE(p.nome, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'nome', 'Usuário Novo') AS nome,
  COALESCE(p.cpf, u.raw_user_meta_data->>'cpf') AS cpf,
  COALESCE(p.tipo, 
    LOWER(REPLACE(REPLACE(REPLACE(u.raw_user_meta_data->>'profile', 'síndico', 'sindico'), 'subsíndico', 'subsindico'), 'proprietário', 'proprietario')),
    'morador'
  ) AS tipo,
  COALESCE(p.unidade, m.unidade, u.raw_user_meta_data->>'unidade', u.raw_user_meta_data->>'unit', 'Apto Geral') AS unidade,
  COALESCE(p.condominio_id, m.condominio_id, s.condominio_id) AS condominio_id,
  COALESCE(p.ativo, true) AS ativo
FROM 
  auth.users u
LEFT JOIN 
  public.perfil p ON u.id = p.id
LEFT JOIN 
  public.moradores m ON u.id::text = m.id::text
LEFT JOIN 
  public.sindico s ON u.id::text = s.id::text;

-- GRANT de leitura pública para a view de profiles para as conexões authenticated/anon
GRANT SELECT ON public.profiles TO authenticated, anon;

-- ==========================================================================
-- 15. DIRETIVAS DE RLS (ROW LEVEL SECURITY) BASEADAS NOS CARGOS E FUNÇÕES
-- ==========================================================================

-- A. Políticas para a Tabela 'perfis'
DROP POLICY IF EXISTS "Permitir leitura de perfis" ON perfis;
DROP POLICY IF EXISTS "Permitir inserções públicas de perfis" ON perfis;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Permitir tudo para simulação de perfis" ON perfis;

CREATE POLICY "Controle Geral para Admins em perfis" ON perfis 
  FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid())) 
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Leitura total de perfis por Colaboradores e Síndicos" ON perfis 
  FOR SELECT TO authenticated 
  USING (public.is_colaborador(auth.uid()) OR public.is_sindico(auth.uid()));

CREATE POLICY "Leitura e Escrita do próprio registro em perfis" ON perfis 
  FOR ALL TO authenticated 
  USING (auth.uid() = auth_user_id) 
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Inserção pública para sincronismo de perfis" ON perfis
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir tudo para simulação de perfis" ON perfis FOR ALL USING (true);


-- B. Políticas de RLS para a tabela 'perfil' (singular)
DROP POLICY IF EXISTS "Permitir leitura de perfil singular" ON perfil;
DROP POLICY IF EXISTS "Permitir inserções públicas de perfil singular" ON perfil;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil singular" ON perfil;
DROP POLICY IF EXISTS "Permitir tudo para simulação de perfil singular" ON perfil;

CREATE POLICY "Acesso completo de Admin e Colab no perfil singular" ON perfil 
  FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()) OR public.is_colaborador(auth.uid())) 
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_colaborador(auth.uid()));

CREATE POLICY "Leitura e Escrita do próprio perfil singular" ON perfil 
  FOR ALL TO authenticated 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Garantir inserção de perfil no cadastro" ON perfil
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir tudo para simulação de perfil" ON perfil FOR ALL USING (true);


-- C. Políticas de Proteção para a Tabela 'condominios'
DROP POLICY IF EXISTS "Permitir tudo para simulação de condominios" ON condominios;

CREATE POLICY "Acesso irrestrito a Condomínios para Admin e Colaborador" ON condominios
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_colaborador(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_colaborador(auth.uid()));

CREATE POLICY "Síndicos leem e alteram apenas seu condomínio" ON condominios
  FOR ALL TO authenticated
  USING (
    public.is_sindico(auth.uid()) AND (
      id = (SELECT condominio_id FROM public.perfil WHERE id = auth.uid()) OR
      sindico = (SELECT nome FROM public.perfil WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    public.is_sindico(auth.uid()) AND (
      id = (SELECT condominio_id FROM public.perfil WHERE id = auth.uid()) OR
      sindico = (SELECT nome FROM public.perfil WHERE id = auth.uid())
    )
  );

CREATE POLICY "Moradores visualizam seu próprio condomínio vinculado" ON condominios
  FOR SELECT TO authenticated
  USING (
    public.is_morador(auth.uid()) AND 
    id = (SELECT condominio_id FROM public.perfil WHERE id = auth.uid())
  );

CREATE POLICY "Backup de simulação irrestrita para condominios de teste" ON condominios FOR ALL USING (true);


-- D. Políticas de RLS para a Tabela 'moradores'
DROP POLICY IF EXISTS "Permitir tudo para simulação de moradores" ON moradores;

CREATE POLICY "Cadastro e controle de moradores para Admin e Colab" ON moradores
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_colaborador(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_colaborador(auth.uid()));

CREATE POLICY "Síndicos gerenciam moradores de seu condomínio" ON moradores
  FOR ALL TO authenticated
  USING (
    public.is_sindico(auth.uid()) AND 
    condominio_id = (SELECT condominio_id FROM public.perfil WHERE id = auth.uid())
  )
  WITH CHECK (
    public.is_sindico(auth.uid()) AND 
    condominio_id = (SELECT condominio_id FROM public.perfil WHERE id = auth.uid())
  );

CREATE POLICY "Morador pode ver lista de vizinhos do seu condomínio" ON moradores
  FOR SELECT TO authenticated
  USING (
    condominio_id = (SELECT condominio_id FROM public.perfil WHERE id = auth.uid())
  );

CREATE POLICY "Permitir tudo para simulação de moradores" ON moradores FOR ALL USING (true);


-- E. Políticas de RLS para a Tabela 'sindico'
DROP POLICY IF EXISTS "Permitir tudo para simulação de sindico" ON sindico;

CREATE POLICY "Controle total de Síndicos para Admins e Colaboradores" ON sindico
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_colaborador(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_colaborador(auth.uid()));

CREATE POLICY "Síndicos gerenciam dados da sua própria conta" ON sindico
  FOR ALL TO authenticated
  USING (
    public.is_sindico(auth.uid()) AND (
      id = auth.uid()::text OR
      email = (SELECT email FROM public.perfil WHERE id = auth.uid()) OR
      cpf = (SELECT cpf FROM public.perfil WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    public.is_sindico(auth.uid()) AND (
      id = auth.uid()::text OR
      email = (SELECT email FROM public.perfil WHERE id = auth.uid()) OR
      cpf = (SELECT cpf FROM public.perfil WHERE id = auth.uid())
    )
  );

CREATE POLICY "Todos podem ler o síndico de seu condomínio" ON sindico
  FOR SELECT TO authenticated
  USING (
    condominio_id = (SELECT condominio_id FROM public.perfil WHERE id = auth.uid()) OR
    condominio_id IS NULL
  );

CREATE POLICY "Permitir tudo para simulação de sindico" ON sindico FOR ALL USING (true);


-- 16. Trigger automático de Sincronização de Cadastro pós-Auth (Grava unicamente em perfil)
-- Execute este bloco para garantir que, caso o e-mail exija confirmação,
-- o perfil correspondente seja injetado direto no banco pelo servidor Postgres.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Inserção APENAS na tabela física 'perfil' (singular) conforme solicitado
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

`;

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

-- 5. Tabela de Perfis de Usuários (Tabela Primária 'perfis' para compatibilidade do app)
CREATE TABLE IF NOT EXISTS perfis (
  id UUID PRIMARY KEY,
  auth_user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  email TEXT NOT NULL,
  unidade TEXT,
  tipo TEXT NOT NULL, -- administrador, colaborador, sindico, etc.
  perfil TEXT, -- fallback/alias
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Caso a tabela perfis já exista de criações passadas, garanta que suas colunas adicionais existam:
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS unidade TEXT;
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS perfil TEXT;

-- 5b. Tabela 'perfil' (Singular) - Conforme solicitado para compatibilidade direta e trigger dedicada
CREATE TABLE IF NOT EXISTS perfil (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT,
  tipo TEXT NOT NULL,
  unidade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garante que todas as colunas existem na tabela 'perfil' (singular)
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.perfil ADD COLUMN IF NOT EXISTS unidade TEXT;

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
  unidade TEXT,
  condominio_id TEXT,
  proprietario BOOLEAN DEFAULT true,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
CREATE POLICY "Permitir leitura de perfis" ON perfis FOR SELECT USING (true);
CREATE POLICY "Permitir inserções públicas de perfis" ON perfis FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização do próprio perfil" ON perfis FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Permitir tudo para simulação de perfis" ON perfis FOR ALL USING (true);

-- Políticas de RLS para a tabela 'perfil' (singular)
ALTER TABLE perfil ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura de perfil singular" ON perfil FOR SELECT USING (true);
CREATE POLICY "Permitir inserções públicas de perfil singular" ON perfil FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização do próprio perfil singular" ON perfil FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Permitir tudo para simulação de perfil singular" ON perfil FOR ALL USING (true);

-- 6. Trigger automático de Sincronização de Cadastro pós-Auth (Grava em perfis e perfil)
-- Execute este bloco para garantir que, caso o e-mail exija confirmação,
-- o perfil correspondente seja injetado direto no banco pelo servidor Postgres.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Inserção na tabela 'perfis' (plural) usada pelo aplicativo
  INSERT INTO public.perfis (id, auth_user_id, nome, cpf, email, unidade, tipo, perfil)
  VALUES (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'nome', 'Usuário Novo')),
    coalesce(new.raw_user_meta_data->>'cpf', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'unit', coalesce(new.raw_user_meta_data->>'unidade', 'Apto Geral')),
    coalesce(lower(replace(replace(replace(new.raw_user_meta_data->>'profile', 'síndico', 'sindico'), 'subsíndico', 'subsindico'), 'proprietário', 'proprietario')), 'morador'),
    coalesce(new.raw_user_meta_data->>'profile', 'Morador')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Inserção na tabela 'perfil' (singular) com as colunas: id, nome, email, cpf, tipo, unidade
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

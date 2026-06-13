export interface Boleto {
  id: string;
  referencia: string;
  vencimento: string;
  valor: number;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  codigoBarras: string;
}

export interface Booking {
  id: string;
  area: string;
  data: string;
  periodo: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  status: 'Confirmado' | 'Pendente';
}

export interface Assembly {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  pauta: string;
  votacaoAtiva?: boolean;
  perguntaVotacao?: string;
  votosFavor?: number;
  votosContra?: number;
  votoUsuario?: 'Favor' | 'Contra';
}

export interface Ticket {
  id: string;
  categoria: 'Manutenção' | 'Limpeza' | 'Barulho' | 'Financeiro' | 'Outros';
  titulo: string;
  descricao: string;
  dataCriacao: string;
  status: 'Aberto' | 'Em Andamento' | 'Resolvido';
}

export interface QuoteRequest {
  id: string;
  condominioNome: string;
  endereco: string;
  unidades: number;
  contatoNome: string;
  contatoEmail: string;
  contatoTelefone: string;
  cargo: 'Síndico' | 'Conselheiro' | 'Morador' | 'Administradora';
}

export interface ContactMessage {
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  data: string;
}

export interface Sindico {
  id?: string;
  nome: string;
  sobrenome?: string;
  apelido?: string;
  cpf?: string;
  foto_url?: string;
  telefone?: string;
  whatsapp?: string;
  condominio_id?: string;
  email?: string;
}



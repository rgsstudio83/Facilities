import { ArrowUp, CreditCard, ShieldAlert, ShieldCheck, LockKeyhole, MapPin, Wrench } from 'lucide-react';
import Logo from './Logo';

interface FooterProps {
  onOpenPortal: () => void;
  onNavigate: (type: 'home' | 'servico' | 'local' | 'blog' | 'faq', slug?: string) => void;
}

export default function Footer({ onOpenPortal, onNavigate }: FooterProps) {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const servicesLinks = [
    { name: 'Administração de Condomínios', slug: 'administracao-de-condominios' },
    { name: 'Gestão Financeira', slug: 'gestao-financeira' },
    { name: 'Síndico Profissional', slug: 'sindico-profissional' },
    { name: 'Assessoria Jurídica', slug: 'assessoria-juridica' },
    { name: 'Gestão de Inadimplência', slug: 'gestao-de-inadimplencia' },
    { name: 'Recursos Humanos', slug: 'recursos-humanos' },
    { name: 'Prestação de Contas', slug: 'prestacao-de-contas' },
  ];

  const citiesLinks = [
    { name: 'Santos', slug: 'santos' },
    { name: 'São Vicente', slug: 'sao-vicente' },
    { name: 'Praia Grande', slug: 'praia-grande' },
    { name: 'Guarujá', slug: 'guaruja' },
    { name: 'Cubatão', slug: 'cubatao' },
    { name: 'Mongaguá', slug: 'mongagua' },
    { name: 'Itanhaém', slug: 'itanhaem' },
  ];

  return (
    <footer className="w-full py-16 px-4 md:px-12 bg-surface-container border-t border-border-light relative font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        
        {/* Col 1: Logo & Mission Pitch */}
        <div className="space-y-6 lg:col-span-2">
          <a href="#home" onClick={() => onNavigate('home')}>
            <Logo className="h-9 w-auto" />
          </a>
          <p className="font-sans text-xs text-secondary leading-relaxed max-w-sm">
            Excelência jurídica, proximidade humana e transparência absoluta na administração de condomínios residenciais e comerciais regulamentados em Santos e na Baixada Santista de forma integral.
          </p>
          <div className="space-y-2 select-none">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Credenciais & Certificações</p>
            <div className="flex gap-3 text-xs text-secondary">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" /> OAB Santos</span>
              <span>●</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" /> Superlógica Partner</span>
            </div>
          </div>
        </div>

        {/* Col 2: Services Quick Links */}
        <div>
          <h4 className="font-sans font-extrabold text-xs uppercase tracking-widest text-[#101c29] mb-5">
            Nossos Serviços
          </h4>
          <nav className="flex flex-col gap-2.5">
            {servicesLinks.map((link) => (
              <a
                key={link.slug}
                href={`#servico/${link.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('servico', link.slug);
                }}
                className="text-xs text-secondary hover:text-primary transition-colors flex items-center gap-1"
              >
                <Wrench className="w-3 h-3 text-gray-400" />
                {link.name}
              </a>
            ))}
          </nav>
        </div>

        {/* Col 3: Local SEO Cities */}
        <div>
          <h4 className="font-sans font-extrabold text-xs uppercase tracking-widest text-[#101c29] mb-5">
            Áreas Atendidas
          </h4>
          <nav className="flex flex-col gap-2.5">
            {citiesLinks.map((link) => (
              <a
                key={link.slug}
                href={`#local/${link.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('local', link.slug);
                }}
                className="text-xs text-secondary hover:text-primary transition-colors flex items-center gap-1"
              >
                <MapPin className="w-3 h-3 text-gray-400" />
                Administradora em {link.name}
              </a>
            ))}
          </nav>
        </div>

        {/* Col 4: Operations & Directories */}
        <div>
          <h4 className="font-sans font-extrabold text-xs uppercase tracking-widest text-[#101c29] mb-5">
            Publicações
          </h4>
          <nav className="flex flex-col gap-3 mb-6">
            <a
              href="#blog"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('blog');
              }}
              className="text-xs font-bold text-primary hover:underline hover:text-primary-hover block"
            >
              Blog do Síndico (100 Artigos) &rarr;
            </a>

            <a
              href="#faq"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('faq');
              }}
              className="text-xs font-bold text-[#101c29] hover:underline block"
            >
              Central de FAQ SEO &rarr;
            </a>
          </nav>

          <h4 className="font-sans font-extrabold text-xs uppercase tracking-widest text-[#101c29] mb-4">
            Área Reservada
          </h4>
          <button
            id="footer-portal-trigger-btn"
            onClick={onOpenPortal}
            className="inline-block px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-white rounded-lg font-sans text-xs font-semibold transition-all active:scale-95 cursor-pointer w-full text-center"
          >
            Acesso ao Condômino
          </button>
        </div>

      </div>

      {/* Credits banner */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border-light flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="font-sans text-[11px] text-secondary">
          © {new Date().getFullYear()} Facilities Administração de Condomínios. CNPJ: 12.345.678/0001-90. Todos os direitos reservados.
        </p>
        <div className="flex gap-4 items-center text-gray-500">
          <CreditCard className="w-5 h-5 cursor-help hover:text-primary transition-all" title="Pagamento por Pix ou boleto integrado" />
          <LockKeyhole className="w-5 h-5 cursor-help hover:text-primary transition-all" title="Acesso certificado SSL super seguro" />
          
          {/* Scroll to Top button */}
          <button
            id="scroll-to-top-btn"
            onClick={handleScrollToTop}
            className="w-8 h-8 rounded-full bg-white hover:bg-primary hover:text-white flex items-center justify-center transition-all border border-border-light shadow-sm"
            title="Voltar ao topo"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}

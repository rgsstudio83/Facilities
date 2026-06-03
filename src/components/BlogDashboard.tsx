import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, Clock, Calendar, ChevronRight, Share2, BookOpen, ExternalLink, MessageSquare } from 'lucide-react';
import { complete100BlogIndex, BlogArticle } from '../data/seoData';

interface BlogDashboardProps {
  onArticleRead?: (slug: string) => void;
  onOpenQuote?: () => void;
}

export default function BlogDashboard({ onArticleRead, onOpenQuote }: BlogDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);

  const categories = [
    'Todos',
    'Gestão Condominial',
    'Finanças',
    'Jurídico',
    'Assembleias',
    'Segurança',
    'Manutenção',
    'Síndico Profissional'
  ];

  const filteredArticles = useMemo(() => {
    return complete100BlogIndex.filter(art => {
      const matchesSearch = 
        art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        art.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = activeCategory === 'Todos' || art.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const handleSelectArticle = (art: BlogArticle) => {
    setSelectedArticle(art);
    if (onArticleRead) {
      onArticleRead(art.slug);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    setSelectedArticle(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (selectedArticle) {
    return (
      <div id="blog-article-reader" className="py-20 px-4 md:px-12 bg-white animate-fade-in">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Back button */}
          <button
            id="blog-back-to-list-btn"
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-primary group hover:underline focus:outline-none focus:ring-0"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para o Catálogo do Blog
          </button>

          {/* Article Header info */}
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              {selectedArticle.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold font-display text-[#101c29] leading-tight tracking-tight">
              {selectedArticle.title}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-sans border-b border-gray-100 pb-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{selectedArticle.publishedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{selectedArticle.readTime} de leitura</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary">SEO Otimizado</span>
              </div>
            </div>
          </div>

          {/* Article Body Content */}
          <article className="prose max-w-none text-sm md:text-base text-secondary font-sans leading-relaxed space-y-6 whitespace-pre-line">
            {selectedArticle.content}
          </article>

          {/* Keywords panel */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 select-none">
            <h4 className="text-xs font-bold font-mono text-[#101c29] uppercase tracking-wider">Metatags Palavras-chave</h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedArticle.keywords.map((kw, i) => (
                <span key={i} className="text-[10px] font-mono bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Author footer card */}
          <div className="p-6 bg-[#f8fafc] border border-border-light rounded-2xl flex flex-col sm:flex-row gap-4 items-center">
            <img
              alt="Dra. Cristhiane Xavier"
              className="w-16 h-16 rounded-full object-cover border border-primary/20 shrink-0"
              referrerPolicy="no-referrer"
              src="https://lh3.googleusercontent.com/aida/AP1WRLtSKxSvtVrS0wpO-63d1oTHkWkboBNqf2dC6l_9jk5KWr8nyPpk_VXooU8oaW_L7aB4ttNt_jIMd8JG4pvmUwdYFGKgrg5SbbPrGQ8dBSzWViM03NKE5Qw0vUUUK_FIQOmi6VrOkUQaxsrdfdCX3907ur9CtYI3QIfB2Ovz9hS2i5ajMcP4dxek4YNEiiF2deVajpQgCb9vTPy5FqaaBImjNHTZUw6qkdqcpY8YAhoeEZF4gAetWyFoxX0"
            />
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-bold text-primary uppercase">Escrito por</span>
              <h5 className="font-sans font-bold text-sm text-[#101c29]">Dra. Cristhiane Xavier</h5>
              <p className="text-xs text-gray-400">
                Especialista em Direito Imobiliário e Direito Condominial na Baixada Santista com mais de 15 anos de atuação.
              </p>
            </div>
          </div>

          {/* Page CTA panel */}
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 text-center space-y-4">
            <h4 className="font-display font-bold text-lg text-primary">Precisa de melhorias na gestão do seu condomínio?</h4>
            <p className="text-xs text-secondary max-w-md mx-auto">
              Seja em Santos, São Vicente, Praia Grande ou Guarujá, o time técnico da Facilities possui a solução exata que o seu edifício merece.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                id="blog-reader-cta-quote"
                onClick={onOpenQuote}
                className="bg-primary hover:bg-primary-hover text-on-primary px-5 py-2.5 rounded-lg text-xs font-bold active:scale-95 transition-all shadow-md cursor-pointer"
              >
                Solicitar Cotação sem Compromisso
              </button>
              <button
                id="blog-reader-cta-whatsapp"
                onClick={() => window.open('https://wa.me/5513999999999', '_blank')}
                className="bg-[#2E7D32] hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold active:scale-95 transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                Chamar no WhatsApp
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div id="blog-dashboard-root" className="py-20 px-4 md:px-12 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-primary font-semibold text-xs tracking-widest uppercase font-sans">
            Plano Editorial Completo (100 Artigos)
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold font-display text-[#101c29] leading-tight tracking-tight">
            Blog da Facilities Administração Condominial
          </h2>
          <p className="text-sm font-sans text-secondary leading-relaxed">
            Navegue pelo nosso plano abrangente de posicionamento com <strong>100 temas técnicos e contábeis de alto impacto</strong>, formatados sob as melhores diretrizes de SEO atualizadas em 2026.
          </p>
        </div>

        {/* Filter and Search Box Row */}
        <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm space-y-4 lg:space-y-0 lg:flex lg:gap-4 lg:items-center">
          
          {/* Real search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="blog-search-box-input"
              type="text"
              placeholder="Pesquisar artigos do plano editorial (ex: maresia, IPTU, portaria, conselho)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-sans pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-on-surface"
            />
          </div>

          {/* Horizontal scroll for categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 shrink-0 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`blog-category-badge-btn-${cat}`}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-secondary hover:bg-gray-200 cursor-pointer'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Articles Grid */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((art, idx) => (
              <div
                key={art.id}
                id={`blog-grid-card-${art.id}`}
                className="bg-white rounded-2xl border border-border-light flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Content top section */}
                <div className="p-6 space-y-4">
                  {/* Category and Index count */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-md">
                      {art.category}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      Artigo {(idx + 1).toString().padStart(3, '0')}
                    </span>
                  </div>

                  <h3 className="font-sans font-extrabold text-sm md:text-base text-[#101c29] line-clamp-2 leading-snug group-hover:text-primary">
                    {art.title}
                  </h3>

                  <p className="text-xs text-secondary leading-relaxed line-clamp-3">
                    {art.excerpt}
                  </p>
                </div>

                {/* Card footer details */}
                <div className="px-6 pb-6 pt-4 border-t border-gray-50 bg-[#fafcfd]/50 flex justify-between items-center text-xs text-gray-500 font-sans mt-auto">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{art.readTime}</span>
                  </div>
                  
                  <button
                    id={`blog-read-action-btn-${art.id}`}
                    onClick={() => handleSelectArticle(art)}
                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline hover:text-primary-hover focus:outline-none"
                  >
                    <span>Ler Artigo Integral</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 text-secondary">
            <p className="text-sm font-sans font-semibold">Nenhum artigo encontrado no plano editorial de 100 títulos.</p>
            <p className="text-xs text-gray-400 mt-1">Experimente limpar sua pesquisa ou buscar por categorias gerais.</p>
          </div>
        )}

        {/* Counter widget footer */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center text-xs text-gray-400 font-sans border-t border-gray-200/60 pt-6">
          <span>Mostrando {filteredArticles.length} de 100 artigos catalogados no Plano Editorial</span>
          <span>● Estrutura Indexada aprovada para robôs de busca</span>
        </div>

      </div>
    </div>
  );
}

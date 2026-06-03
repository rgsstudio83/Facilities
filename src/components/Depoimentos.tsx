import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star, ThumbsUp, CheckSquare } from 'lucide-react';

interface Testimonial {
  initials: string;
  name: string;
  role: string;
  text: string;
  stars: number;
}

export default function Depoimentos() {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials: Testimonial[] = [
    {
      initials: 'KW',
      name: 'Kristin Watson',
      role: 'Síndica Res. Mar Azul',
      text: '"A transparência na prestação de contas mudou por completo a relação dos moradores com o conselho técnico. O suporte diário reduz nossas preocupações administrativas a quase zero. Excelente e sério trabalho!"',
      stars: 5,
    },
    {
      initials: 'RR',
      name: 'Ronald Richards',
      role: 'Presidente Club Yacht',
      text: '"O suporte jurídico integrado da Dra. Cristhiane nos deu a segurança necessária para gerir uma grande reforma estrutural no condomínio clube. Evitamos litígios contratuais complexos com empreiteiras."',
      stars: 5,
    },
    {
      initials: 'WW',
      name: 'Wade Warren',
      role: 'Morador Ed. Horizonte',
      text: '"O acesso online pelo celular facilita demais o dia a dia. Encontro boletos do mês, atas completas e prestação de contas em tempo real com poucos cliques, sem burocracia desnecessária. Recomendo."',
      stars: 5,
    },
  ];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="depoimentos" className="py-20 px-4 md:px-12 bg-background border-b border-border-light">
      <div className="max-w-7xl mx-auto">
        {/* Caption & Header & Navigation Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div className="space-y-3">
            <span className="text-primary font-semibold text-xs tracking-widest uppercase font-sans">
              Depoimentos
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-display text-on-surface tracking-tight">
              O que dizem os nossos clientes
            </h2>
            <p className="text-sm text-secondary font-sans max-w-lg leading-relaxed">
              Confira os relatos de síndicos e condôminos reais sobre a transparência operacional e jurídica no litoral paulista.
            </p>
          </div>

          {/* Slider Controllers */}
          <div className="flex gap-2">
            <button
              id="testimonial-prev-btn"
              onClick={handlePrev}
              className="p-3 border border-border-light rounded-full bg-white hover:bg-primary/5 hover:text-primary transition-all active:scale-90"
              title="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="testimonial-next-btn"
              onClick={handleNext}
              className="p-3 border border-border-light rounded-full bg-white hover:bg-primary/5 hover:text-primary transition-all active:scale-90"
              title="Próximo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Layout (Grid of 3) & Mobile Single Slider */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          {testimonials.map((test, index) => (
            <div
              key={index}
              id={`testimonial-desktop-card-${index}`}
              className="premium-card p-8 flex flex-col justify-between hover:scale-[1.02] border border-border-light bg-white cursor-help"
            >
              <div className="space-y-6">
                {/* Visual stars and quote design element */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-1 text-amber-500">
                    {[...Array(test.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-primary/10 shrink-0" />
                </div>

                <p className="italic text-secondary text-sm leading-relaxed font-sans">{test.text}</p>
              </div>

              {/* Author badge */}
              <div className="mt-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary select-none">
                  {test.initials}
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm text-on-surface flex items-center gap-1">
                    {test.name}
                    <ThumbsUp className="w-3.5 h-3.5 text-success fill-success/10 shrink-0" />
                  </h4>
                  <p className="text-xs text-secondary">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile / Tablet Dynamic Slider Layout */}
        <div className="block lg:hidden">
          <div
            id="testimonial-mobile-container"
            className="premium-card p-6 md:p-8 flex flex-col justify-between border border-border-light bg-white border-l-4 border-l-primary animate-fade-in"
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex gap-1 text-amber-500">
                  {[...Array(testimonials[activeIndex].stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-primary/10 shrink-0" />
              </div>

              <p className="italic text-secondary text-base leading-relaxed font-sans">
                {testimonials[activeIndex].text}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary select-none">
                {testimonials[activeIndex].initials}
              </div>
              <div className="flex-1">
                <h4 className="font-sans font-bold text-sm text-on-surface flex items-center gap-1.5">
                  {testimonials[activeIndex].name}
                  <ThumbsUp className="w-3.5 h-3.5 text-success fill-success/10 shrink-0" />
                </h4>
                <p className="text-xs text-secondary">{testimonials[activeIndex].role}</p>
              </div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">
                {activeIndex + 1} de {testimonials.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

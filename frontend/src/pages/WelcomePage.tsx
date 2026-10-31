import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Laptop, RotateCcw } from 'lucide-react';
import {
  HangingCatMascot,
  PetHubMascotAvatar,
  PetHubWordmark,
  ScatteredPaws,
} from '../components/BrandAssets';
import { MobileShell } from '../components/MobileShell';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [curtainDone, setCurtainDone] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setCurtainDone(false);
    const timer = setTimeout(() => {
      setCurtainDone(true);
    }, 1650);
    return () => clearTimeout(timer);
  }, [animKey]);

  const replayCurtain = () => {
    setAnimKey((k) => k + 1);
  };

  return (
    <MobileShell hideBottomNav>
      <div className="relative min-h-dvh w-full overflow-hidden bg-[#FFF6EB] flex flex-col">
        {/* Animated Terracotta Curtain pulled down by the Hanging Cat (transição_entrada 1 -> 2 -> 3) */}
        <div
          key={animKey}
          className="absolute inset-0 z-10 flex flex-col animate-curtain-pull"
        >
          <div className="relative flex-1 bg-[#B65744] shadow-2xl flex flex-col items-center justify-between px-7 pt-24 pb-10">
            <ScatteredPaws />

            {/* Replay Transition Button */}
            <button
              onClick={replayCurtain}
              className="absolute top-4 right-4 z-20 px-2.5 py-1.5 rounded-full bg-[#FFF6EB]/15 hover:bg-[#FFF6EB]/25 text-[#FFF6EB] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Rever animação do gatinho"
            >
              <RotateCcw className="w-3 h-3" />
              Animação
            </button>

            <div />

            {/* Center Brand Identity (tela_inicial.jpg) */}
            <div
              className={`relative z-20 flex flex-col items-center gap-5 transition-all duration-500 ${
                curtainDone
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
            >
              <PetHubMascotAvatar size="lg" />
              <PetHubWordmark light size="lg" />
              <p className="text-center text-xs text-[#FFF6EB]/85 max-w-[260px] leading-relaxed">
                Produtos de conveniência e banho & tosa nos melhores petshops do
                seu bairro em uma única comanda.
              </p>
            </div>

            {/* Bottom CTAs */}
            <div
              className={`relative z-20 w-full space-y-3 transition-all duration-500 delay-100 ${
                curtainDone
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
            >
              <button
                onClick={() => navigate('/login')}
                className="w-full py-4 rounded-full bg-[#FFF6EB] hover:bg-white text-[#6E3426] font-extrabold text-sm shadow-lg transition cursor-pointer"
              >
                Login
              </button>

              <button
                onClick={() => navigate('/cadastro')}
                className="w-full py-4 rounded-full bg-[#C57969]/55 hover:bg-[#C57969]/75 border border-[#FFF6EB]/45 text-[#FFF6EB] font-extrabold text-sm transition cursor-pointer"
              >
                Cadastrar-se
              </button>

              <div className="pt-2 flex items-center justify-between text-[11px] text-[#FFF6EB]/85 px-2">
                <button
                  onClick={() => navigate('/inicio')}
                  className="underline underline-offset-2 font-semibold hover:text-white cursor-pointer"
                >
                  Explorar vitrine agora
                </button>
                <button
                  onClick={() => navigate('/lojista')}
                  className="inline-flex items-center gap-1 font-bold text-[#F3B63F] hover:underline cursor-pointer"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  Sou Petshop Parceiro
                </button>
              </div>

              <div className="w-28 h-1 rounded-full bg-[#FFF6EB]/45 mx-auto mt-3" />
            </div>

            {/* Hanging Cat dangling below the curtain edge while pulling it down */}
            {!curtainDone && (
              <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                <HangingCatMascot />
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileShell>
  );
};

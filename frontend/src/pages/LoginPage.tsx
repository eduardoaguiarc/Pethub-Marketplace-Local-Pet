import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  AtSign,
  ChevronLeft,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  Store,
} from 'lucide-react';
import { PetHubMascotAvatar, PetHubWordmark } from '../components/BrandAssets';
import { MobileShell } from '../components/MobileShell';
import { usePetHub } from '../context/PetHubContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsTutor } = usePetHub();

  const [email, setEmail] = useState('eduardo.silva@pethub.com.br');
  const [password, setPassword] = useState('12345678');
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsTutor('Eduardo Silva');
    navigate('/inicio');
  };

  return (
    <MobileShell hideBottomNav>
      <div className="min-h-dvh bg-[#FFF6EB] flex flex-col">
        {/* Terracotta Curved Header (tela_login.jpg) */}
        <div className="bg-gradient-to-b from-[#A9503B] to-[#B65744] pt-6 pb-16 px-5 rounded-b-[36px] relative text-[#FFF6EB]">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigate('/boas-vindas')}
              className="w-10 h-10 rounded-full bg-[#FFF6EB]/18 border border-[#FFF6EB]/25 flex items-center justify-center hover:bg-[#FFF6EB]/25 transition cursor-pointer"
              aria-label="Voltar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3.5 py-1 rounded-full bg-[#FFF6EB]/15 border border-[#FFF6EB]/20 text-[11px] font-bold tracking-widest uppercase">
              PETS &amp; CARE
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <PetHubMascotAvatar size="md" showGoldenBadge />
            <PetHubWordmark light size="md" />
          </div>
        </div>

        {/* Floating Login Card */}
        <div className="px-5 -mt-9 flex-1 flex flex-col justify-between pb-6">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[28px] shadow-xl p-6 space-y-4 border border-[#C57969]/15"
          >
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-extrabold text-[#302B29]">
                Bem-vindo!
              </h1>
              <p className="text-xs text-[#302B29]/65">
                Acesse sua conta para cuidar do seu melhor amigo !
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#302B29]/75 mb-1.5">
                E-mail ou Telefone
              </label>
              <div className="relative flex items-center">
                <AtSign className="w-4 h-4 text-[#302B29]/40 absolute left-3.5" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF8F6] border border-[#302B29]/10 text-sm focus:outline-none focus:border-[#B65744]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#302B29]/75 mb-1.5">
                Senha
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#302B29]/40 absolute left-3.5" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#FAF8F6] border border-[#302B29]/10 text-sm focus:outline-none focus:border-[#B65744]"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3.5 text-[#302B29]/45 hover:text-[#302B29] cursor-pointer"
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[#302B29]/80 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#A9503B] rounded"
                />
                Lembrar de mim
              </label>
              <button
                type="button"
                onClick={() => navigate('/inicio')}
                className="font-bold text-[#A9503B] hover:underline cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#A9503B] hover:bg-[#B65744] text-[#FFF6EB] font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              Entrar
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-[#302B29]/10" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#302B29]/45">
                Ou entre com
              </span>
              <div className="h-px flex-1 bg-[#302B29]/10" />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/inicio')}
                className="py-2.5 rounded-2xl border border-[#302B29]/12 hover:bg-[#FFF6EB]/60 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                <span className="text-[#EA4335] font-black">G</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/inicio')}
                className="py-2.5 rounded-2xl border border-[#302B29]/12 hover:bg-[#FFF6EB]/60 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                
              </button>
              <button
                type="button"
                onClick={() => navigate('/inicio')}
                className="py-2.5 rounded-2xl border border-[#C57969]/35 bg-[#FFF6EB]/50 hover:bg-[#FFF6EB] text-[#A9503B] flex items-center justify-center gap-1 text-xs font-extrabold cursor-pointer"
              >
                <Fingerprint className="w-4 h-4" />
                ID
              </button>
            </div>

            {/* Merchant Quick Portal Link */}
            <button
              type="button"
              onClick={() => navigate('/lojista')}
              className="w-full py-2.5 px-3 rounded-xl bg-[#FFF6EB] border border-[#C57969]/35 text-[#A9503B] text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-[#F3B63F]/15 transition cursor-pointer"
            >
              <Store className="w-4 h-4" />
              Entrar como Petshop Parceiro (Painel B2B)
            </button>
          </form>

          {/* Footer */}
          <div className="text-center space-y-3 mt-6">
            <p className="text-xs text-[#302B29]/75">
              Ainda não tem uma conta?{' '}
              <Link
                to="/cadastro"
                className="font-extrabold text-[#A9503B] underline"
              >
                Cadastrar-se
              </Link>
            </p>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-[#302B29]/8 text-[11px] font-semibold text-[#302B29]/75 shadow-2xs">
              🐾 Clube de Vantagens e Saúde Pet
            </div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
};

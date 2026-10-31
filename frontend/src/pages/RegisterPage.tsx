import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  AtSign,
  ChevronLeft,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  Phone,
  User,
} from 'lucide-react';
import { PetHubMascotAvatar, PetHubWordmark } from '../components/BrandAssets';
import { MobileShell } from '../components/MobileShell';
import { usePetHub } from '../context/PetHubContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsTutor, pushToast } = usePetHub();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Pethub2026');
  const [showPwd, setShowPwd] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [wantsPromos, setWantsPromos] = useState(true);

  const strength = useMemo(() => {
    if (password.length === 0) return { bars: 0, label: 'Mín. 8' };
    if (password.length < 6) return { bars: 1, label: 'Fraca' };
    if (password.length < 10) return { bars: 2, label: 'Boa' };
    return { bars: 3, label: 'Forte' };
  }, [password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsTutor(fullName || 'Eduardo Silva');
    pushToast(
      'Conta criada no PetHub Club! 🐾',
      'Bem-vindo! Aproveite entrega rápida e agendamento unificado.',
      'success'
    );
    navigate('/inicio');
  };

  return (
    <MobileShell hideBottomNav>
      <div className="min-h-dvh bg-[#FFF6EB] flex flex-col">
        {/* Header (tela_cadastro.jpg) */}
        <div className="bg-gradient-to-b from-[#A9503B] to-[#B65744] pt-6 pb-14 px-5 rounded-b-[36px] text-[#FFF6EB]">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-[#FFF6EB]/18 border border-[#FFF6EB]/25 flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3.5 py-1 rounded-full bg-[#FFF6EB]/15 border border-[#FFF6EB]/20 text-[11px] font-bold tracking-widest uppercase">
              PETS &amp; CARE
            </span>
          </div>

          <div className="flex flex-col items-center gap-2.5">
            <PetHubMascotAvatar size="md" showGoldenBadge />
            <PetHubWordmark light size="md" />
          </div>
        </div>

        {/* Form Card */}
        <div className="px-5 -mt-8 pb-8 flex-1">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[28px] shadow-xl p-6 space-y-3.5 border border-[#C57969]/15"
          >
            <div className="text-center space-y-1">
              <h1 className="text-xl font-extrabold text-[#302B29]">
                Junte-se ao Club! 🐾
              </h1>
              <p className="text-xs text-[#302B29]/65 leading-relaxed">
                Cadastre-se para oferecer o melhor cuidado, saúde e mimos para o
                seu melhor amigo !
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#302B29]/75 mb-1">
                Nome Completo
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[#302B29]/40 absolute left-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF8F6] border border-[#302B29]/10 text-sm focus:outline-none focus:border-[#B65744]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#302B29]/75 mb-1">
                E-mail
              </label>
              <div className="relative flex items-center">
                <AtSign className="w-4 h-4 text-[#302B29]/40 absolute left-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF8F6] border border-[#302B29]/10 text-sm focus:outline-none focus:border-[#B65744]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#302B29]/75 mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-[#302B29]/40 absolute left-3.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF8F6] border border-[#302B29]/10 text-sm focus:outline-none focus:border-[#B65744]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#302B29]/75 mb-1">
                Senha
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#302B29]/40 absolute left-3.5" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FAF8F6] border border-[#302B29]/10 text-sm focus:outline-none focus:border-[#B65744]"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3.5 text-[#302B29]/45 cursor-pointer"
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {/* Password strength meter (Mel #F3B63F bars) */}
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition ${
                      strength.bars >= idx ? 'bg-[#F3B63F]' : 'bg-[#302B29]/12'
                    }`}
                  />
                ))}
                <span className="text-[11px] font-semibold text-[#302B29]/55">
                  {strength.label}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs text-[#302B29]/80">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#A9503B] rounded"
                />
                <span className="leading-snug">
                  Li e concordo com os{' '}
                  <strong className="text-[#A9503B] underline">
                    Termos de Uso
                  </strong>{' '}
                  e{' '}
                  <strong className="text-[#A9503B] underline">
                    Privacidade
                  </strong>{' '}
                  do PetHub Club.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsPromos}
                  onChange={(e) => setWantsPromos(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#A9503B] rounded"
                />
                <span className="leading-snug">
                  Quero receber mimos, dicas e novidades de saúde para o meu pet
                  🎁
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#A9503B] hover:bg-[#B65744] text-[#FFF6EB] font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              Criar minha conta
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 py-0.5">
              <div className="h-px flex-1 bg-[#302B29]/10" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#302B29]/45">
                Ou cadastre-se com
              </span>
              <div className="h-px flex-1 bg-[#302B29]/10" />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/inicio')}
                className="py-2.5 rounded-2xl border border-[#302B29]/12 flex items-center justify-center font-black text-[#EA4335] text-sm cursor-pointer"
              >
                G
              </button>
              <button
                type="button"
                onClick={() => navigate('/inicio')}
                className="py-2.5 rounded-2xl border border-[#302B29]/12 flex items-center justify-center text-sm cursor-pointer"
              >
                
              </button>
              <button
                type="button"
                onClick={() => navigate('/inicio')}
                className="py-2.5 rounded-2xl border border-[#C57969]/35 bg-[#FFF6EB]/50 text-[#A9503B] flex items-center justify-center gap-1 text-xs font-extrabold cursor-pointer"
              >
                <Fingerprint className="w-4 h-4" />
                ID
              </button>
            </div>

            <p className="text-center text-xs text-[#302B29]/75 pt-2">
              Já possui uma conta?{' '}
              <Link
                to="/login"
                className="font-extrabold text-[#A9503B] underline"
              >
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </MobileShell>
  );
};

# PetHub • Frontend (React + Vite + Tailwind CSS)

Plataforma mobile-first (PWA B2C) e Painel Administrativo Web do Lojista (B2B) modelada sobre os processos BPMN 2.0 do **PetHub: Marketplace Local Pet**.

## Paleta Oficial Aplicada
- **Terracota**: `#B65744`
- **Argila**: `#A9503B`
- **Creme**: `#FFF6EB`
- **Mel**: `#F3B63F`
- **Rosé**: `#C57969`
- **Carvão**: `#302B29`

## Como executar localmente
```bash
cd frontend
npm install
npm run dev
```
Acesse `http://localhost:5173`.

## Fluxos Implementados
- **Entrada & Autenticação** (`/`, `/login`, `/cadastro`): Animação da cortina puxada pelo gatinho mascote + telas de Login e Cadastro do PetHub Club.
- **App do Tutor (B2C)** (`/inicio`, `/busca`, `/loja/:storeId`, `/ofertas`, `/pedidos`, `/perfil`):
  - Geolocalização e ordenação por proximidade (**REQ-01**);
  - Vitrine unificada de produtos físicos + agendamento de estética por porte de baia (**PRC-01**, **RN-01**, **REQ-02**, **RN-05**);
  - Comanda híbrida e checkout com PIX/Cartão (**RN-03**, **REQ-05**);
  - Acompanhamento ao vivo, SLA de 15 minutos (**RN-02**), aprovação mobile de adicionais/triagem sanitária (**REQ-04**, **RN-06**) e avaliação 1–5 estrelas (**REQ-06**).
- **Painel Web do Lojista Parceiro (B2B)** (`/lojista`):
  - Recepção com alerta visual e sonoro (**REQ-03**) + cronômetro SLA 15m (**RN-02**);
  - Triagem clínica, progressão de banho/tosa e solicitação de cross-selling / banho terapêutico (**PRC-02**, **RN-06**);
  - Gestão de estoque/catálogo em tempo real (**PRC-03**) e conciliação de split 90%/10% (**RN-04**).

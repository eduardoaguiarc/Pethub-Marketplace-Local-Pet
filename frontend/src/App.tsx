import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PetHubProvider } from './context/PetHubContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { OffersPage } from './pages/OffersPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { StorePage } from './pages/StorePage';
import { WelcomePage } from './pages/WelcomePage';

export const App: React.FC = () => {
  return (
    <PetHubProvider>
      <BrowserRouter>
        <Routes>
          {/* Entrada com Animação da Cortina & Gatinho -> Tela Inicial */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/boas-vindas" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />

          {/* Fluxo Principal Tutor (B2C Mobile-First PWA) */}
          <Route path="/inicio" element={<HomePage />} />
          <Route path="/busca" element={<SearchPage />} />
          <Route path="/loja/:storeId" element={<StorePage />} />
          <Route path="/ofertas" element={<OffersPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/perfil" element={<ProfilePage />} />

          {/* Painel Administrativo Web do Petshop Parceiro (B2B) */}
          <Route path="/lojista" element={<MerchantDashboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PetHubProvider>
  );
};

export default App;

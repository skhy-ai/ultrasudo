import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Core Pages
import LandingPage from './pages/LandingPage';
import WizardPage from './pages/WizardPage';
import DesktopPage from './pages/DesktopPage';
import BrowserPage from './pages/BrowserPage';

// Generic Iframe Wrapper (for online/hybrid/legacy-HTML apps)
import AppIframe from './components/AppIframe/AppIframe';

// Native React Apps (offline, fully migrated)
import SecureVault from './pages/Apps/SecureVault/SecureVault';
import Calculator from './pages/Apps/Calculator/Calculator';
import TodoList from './pages/Apps/TodoList/TodoList';
import Notebook from './pages/Apps/Notebook/Notebook';
import Pomodoro from './pages/Apps/Pomodoro/Pomodoro';
import Timer from './pages/Apps/Timer/Timer';
import HealthyKitchen from './pages/Apps/HealthyKitchen/HealthyKitchen';
import MarkdownEditor from './pages/Apps/MarkdownEditor/MarkdownEditor';
import KanbanBoard from './pages/Apps/KanbanBoard/KanbanBoard';
import Grocery from './pages/Apps/Grocery/Grocery';
import Yoga from './pages/Apps/Yoga/Yoga';
import BirthdayCard from './pages/Apps/BirthdayCard/BirthdayCard';
import Spreadsheet from './pages/Apps/Spreadsheet/Spreadsheet';
import QuoteGenerator from './pages/Apps/QuoteGenerator/QuoteGenerator';
import FinanceHub from './pages/Apps/FinanceHub/FinanceHub';
import ProductivityHub from './pages/Apps/ProductivityHub/ProductivityHub';
import HealthHub from './pages/Apps/HealthHub/HealthHub';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Core Navigation */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/wizard" element={<WizardPage />} />
        <Route path="/desktop" element={<DesktopPage />} />
        <Route path="/browser" element={<BrowserPage />} />

        {/* Native React App Components */}
        <Route path="/app/finance" element={<FinanceHub />} />
        <Route path="/app/productivity" element={<ProductivityHub />} />
        <Route path="/app/health" element={<HealthHub />} />
        <Route path="/app/calculator" element={<Calculator />} />
        <Route path="/app/todo-list" element={<TodoList />} />
        <Route path="/app/notebook" element={<Notebook />} />
        <Route path="/app/healthy-kitchen" element={<HealthyKitchen />} />
        <Route path="/app/secure-vault" element={<SecureVault />} />
        <Route path="/app/pomodoro-timer" element={<Pomodoro />} />
        <Route path="/app/timer" element={<Timer />} />
        <Route path="/app/markdown-editor" element={<MarkdownEditor />} />
        <Route path="/app/kanban-board" element={<KanbanBoard />} />
        <Route path="/app/grocery" element={<Grocery />} />
        <Route path="/app/yoga" element={<Yoga />} />
        <Route path="/app/birthday-card" element={<BirthdayCard />} />
        <Route path="/app/spreadsheet" element={<Spreadsheet />} />
        <Route path="/app/quote-generator" element={<QuoteGenerator />} />

        {/* Generic Iframe App Viewer — handles all other apps via ?src=&title= */}
        <Route path="/app-view" element={<AppIframe />} />

        {/* Catch-all redirect to Desktop */}
        <Route path="*" element={<Navigate to="/desktop" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

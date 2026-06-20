'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import DashboardView from '@/components/DashboardView';
import EventsView from '@/components/EventsView';
import AnalysisView from '@/components/AnalysisView';
import ResourcesView from '@/components/ResourcesView';
import ReportsView from '@/components/ReportsView';
import SettingsView from '@/components/SettingsView';

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const savedTheme = localStorage.getItem('urbanflow-theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  return (
    <>
      <Navigation activeView={activeView} setActiveView={setActiveView} />
      <main className="main-content">
        {activeView === 'dashboard' && <DashboardView setActiveView={setActiveView} />}
        {activeView === 'events' && <EventsView />}
        {activeView === 'analysis' && <AnalysisView />}
        {activeView === 'resources' && <ResourcesView />}
        {activeView === 'reports' && <ReportsView />}
        {activeView === 'settings' && <SettingsView />}
      </main>
    </>
  );
}


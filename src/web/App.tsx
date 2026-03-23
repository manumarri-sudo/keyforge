import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import { ToastContainer } from './components/Toast';
import { checkApiAvailable } from './lib/api';

export default function App() {
  const [apiReady, setApiReady] = useState<boolean | null>(null);

  useEffect(() => {
    checkApiAvailable().then(setApiReady);
  }, []);

  if (apiReady === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!apiReady) {
    return <LandingPage />;
  }

  return (
    <>
      <Layout />
      <ToastContainer />
    </>
  );
}

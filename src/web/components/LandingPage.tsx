import React, { useState } from 'react';
import ProviderIcon from './ProviderIcon';

const providers = [
  { id: 'openai', name: 'OpenAI', color: '#10A37F', canCreate: true, envVars: ['OPENAI_API_KEY'] },
  { id: 'supabase', name: 'Supabase', color: '#3FCF8E', canCreate: true, envVars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'] },
  { id: 'resend', name: 'Resend', color: '#000000', canCreate: true, envVars: ['RESEND_API_KEY'] },
  { id: 'anthropic', name: 'Anthropic', color: '#D4A574', canCreate: false, envVars: ['ANTHROPIC_API_KEY'] },
  { id: 'stripe', name: 'Stripe', color: '#635BFF', canCreate: false, envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'] },
  { id: 'clerk', name: 'Clerk', color: '#6C47FF', canCreate: false, envVars: ['CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'] },
];

export default function LandingPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText('git clone https://github.com/manumarri-sudo/keyforge.git && cd keyforge && npm install && npm run dev');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>K</span>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              KeyForge
            </span>
          </div>
          <a
            href="https://github.com/manumarri-sudo/keyforge"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">

        {/* Hero - tight, specific, no fluff */}
        <section className="pt-20 pb-12 text-center relative">
          {/* Subtle glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(5, 150, 105, 0.06) 0%, transparent 70%)' }}
          />

          <p className="text-sm font-medium text-emerald-700 mb-4 relative">Stop copy-pasting API keys between projects</p>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 leading-tight relative">
            Connect once.<br />
            Provision keys for every project.
          </h1>

          <p className="text-gray-500 max-w-lg mx-auto mb-8 relative">
            KeyForge stores your service credentials locally and creates fresh,
            named API keys through official APIs whenever you start a new project.
          </p>

          <div className="flex items-center justify-center gap-3 relative">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              {copied ? 'Copied!' : 'Copy install command'}
            </button>
            <a
              href="https://github.com/manumarri-sudo/keyforge"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              View source
            </a>
          </div>
        </section>

        {/* The problem / solution - show don't tell */}
        <section className="pb-16">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Before */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs font-medium text-red-500 mb-3 uppercase tracking-wide">Without KeyForge</p>
              <div className="space-y-2 font-mono text-xs text-gray-500">
                <p className="text-gray-400"># Starting a new project...</p>
                <p>1. Log into OpenAI dashboard</p>
                <p>2. Navigate to API keys</p>
                <p>3. Create key, copy it somewhere</p>
                <p>4. Log into Supabase dashboard</p>
                <p>5. Create new project, wait 2 min</p>
                <p>6. Copy anon key, service key, URL</p>
                <p>7. Log into Stripe dashboard...</p>
                <p className="text-gray-300">8. Repeat for every service</p>
                <p className="text-gray-300">9. Paste everything into .env</p>
                <p className="text-gray-300">10. Pray you didn't mix up keys</p>
              </div>
              <p className="mt-3 text-xs text-gray-400">~15 minutes of tab-switching</p>
            </div>

            {/* After */}
            <div className="bg-white border border-emerald-200 rounded-xl p-5">
              <p className="text-xs font-medium text-emerald-600 mb-3 uppercase tracking-wide">With KeyForge</p>
              <div className="space-y-1 font-mono text-xs">
                <p className="text-gray-400">$ keyforge new my-saas -s openai,supabase,stripe</p>
                <p className="text-gray-400 mt-2">Creating keys for my-saas...</p>
                <div className="mt-1 pl-2 border-l-2 border-emerald-200 space-y-0.5">
                  <p><span className="text-emerald-600">&#10003;</span> <span className="text-gray-500">OpenAI: Created key (sk-proj-****)</span></p>
                  <p><span className="text-emerald-600">&#10003;</span> <span className="text-gray-500">Supabase: Created project + keys</span></p>
                  <p><span className="text-emerald-600">&#10003;</span> <span className="text-gray-500">Stripe: Copied stored keys</span></p>
                </div>
                <p className="text-gray-400 mt-2">&#x2192; .env written to ./my-saas/.env</p>
                <p className="text-emerald-600 mt-1">Done in 8 seconds.</p>
              </div>
              <p className="mt-3 text-xs text-gray-400">One command. All keys. Ready to code.</p>
            </div>
          </div>
        </section>

        {/* Visual demo - fake dashboard */}
        <section className="pb-16">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              </div>
              <div className="flex-1 mx-8">
                <div className="bg-gray-100 rounded-md px-3 py-1 text-xs text-gray-400 text-center font-mono">
                  localhost:5173
                </div>
              </div>
            </div>

            {/* Fake app header */}
            <div className="px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>K</span>
                </div>
                <span className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>KeyForge</span>
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  Running locally
                </span>
              </div>
            </div>

            {/* Fake tabs */}
            <div className="px-6 border-b border-gray-100">
              <div className="flex gap-0">
                <span className="px-4 py-2.5 text-xs font-medium text-gray-900 border-b-2 border-emerald-500">Services</span>
                <span className="px-4 py-2.5 text-xs font-medium text-gray-400">New Project</span>
                <span className="px-4 py-2.5 text-xs font-medium text-gray-400">Projects</span>
              </div>
            </div>

            {/* Fake service grid */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3">
                {providers.slice(0, 6).map((p) => {
                  const isConnected = ['openai', 'supabase', 'anthropic', 'stripe'].includes(p.id);
                  return (
                    <div key={p.id} className="border border-gray-100 rounded-lg overflow-hidden">
                      <div className="h-0.5" style={{ backgroundColor: p.color }} />
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center"
                              style={{ backgroundColor: `${p.color}12`, color: p.color }}
                            >
                              <ProviderIcon providerId={p.id} className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-medium text-gray-800">{p.name}</span>
                          </div>
                          {isConnected ? (
                            <span className="flex items-center gap-1 text-[9px] text-emerald-600">
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                              Connected
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] text-gray-300">
                              <span className="w-1 h-1 rounded-full bg-gray-200" />
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {p.envVars.slice(0, 2).map((v) => (
                            <span key={v} className="px-1 py-0.5 rounded text-[8px] font-mono bg-gray-50 text-gray-300 truncate">
                              {v.replace('NEXT_PUBLIC_', '').replace('SUPABASE_SERVICE_', 'SVC_')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* How it works - tighter */}
        <section className="pb-16">
          <h2 className="text-xl font-bold text-center mb-8">How it works</h2>
          <div className="grid md:grid-cols-3 gap-px bg-gray-200 rounded-xl overflow-hidden">
            {[
              {
                step: '01',
                title: 'Store credentials',
                desc: 'Enter your admin/master API keys once. Stored in your OS keychain (macOS Keychain, Windows Credential Manager) with AES-256 fallback.',
              },
              {
                step: '02',
                title: 'Provision per project',
                desc: 'For OpenAI, Supabase, and Resend, KeyForge calls official APIs to create scoped, named keys. Others get securely copied.',
              },
              {
                step: '03',
                title: 'Export and go',
                desc: 'Download .env, copy to clipboard, or export to any directory. Every action is logged in a local audit trail.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white p-6">
                <span className="text-xs font-mono text-gray-300 block mb-3">{item.step}</span>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Supported services - compact */}
        <section className="pb-16">
          <h2 className="text-xl font-bold text-center mb-2">Supported services</h2>
          <p className="text-sm text-gray-400 text-center mb-8">More coming soon</p>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Service</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Method</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Env vars</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p, i) => (
                  <tr key={p.id} className={i < providers.length - 1 ? 'border-b border-gray-50' : ''}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${p.color}12`, color: p.color }}
                        >
                          <ProviderIcon providerId={p.id} className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-gray-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {p.canCreate ? (
                        <span className="text-xs font-medium text-emerald-600">Creates new key</span>
                      ) : (
                        <span className="text-xs text-gray-400">Copies stored key</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.envVars.map((v) => (
                          <code key={v} className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{v}</code>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Security */}
        <section className="pb-16">
          <div className="bg-gray-900 rounded-2xl p-8 text-white">
            <h2 className="text-lg font-bold mb-4">Your keys never leave your machine</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'System keychain', desc: 'Credentials stored in macOS Keychain, Windows Credential Manager, or Linux Secret Service.' },
                { title: 'AES-256 fallback', desc: 'If keychain is unavailable, keys are encrypted with a machine-specific derived key.' },
                { title: 'Local audit log', desc: 'Every connect, provision, and export is logged to a local append-only file.' },
              ].map((f) => (
                <div key={f.title}>
                  <h3 className="text-sm font-medium text-gray-200 mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-gray-500">
              No cloud. No telemetry. No browser automation. Just API calls to official endpoints.
            </p>
          </div>
        </section>

        {/* Quick start */}
        <section className="pb-12">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Get started</h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex gap-3 items-center">
                <span className="text-gray-300">$</span>
                <span className="text-gray-700">git clone https://github.com/manumarri-sudo/keyforge.git</span>
              </div>
              <div className="flex gap-3 items-center">
                <span className="text-gray-300">$</span>
                <span className="text-gray-700">cd keyforge && npm install && npm run dev</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Opens at localhost:5173. Connect your first service and create a project in under a minute.
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="pb-16 text-center border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold mb-2">Stop managing .env files by hand</h2>
          <p className="text-gray-500 mb-6">KeyForge takes 30 seconds to set up.</p>
          <button
            onClick={handleCopy}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            {copied ? 'Copied!' : 'Copy install command'}
          </button>
        </section>
      </main>
    </div>
  );
}

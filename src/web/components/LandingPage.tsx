import React, { useState } from 'react';

const providers = [
  { name: 'OpenAI', icon: '\u{1F916}', color: '#10A37F', canCreate: true },
  { name: 'Supabase', icon: '\u26A1', color: '#3FCF8E', canCreate: true },
  { name: 'Resend', icon: '\u2709\uFE0F', color: '#000000', canCreate: true },
  { name: 'Anthropic', icon: '\u{1F9E0}', color: '#D4A574', canCreate: false },
  { name: 'Stripe', icon: '\u{1F4B3}', color: '#635BFF', canCreate: false },
  { name: 'Clerk', icon: '\u{1F510}', color: '#6C47FF', canCreate: false },
];

export default function LandingPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText('npx keyforge');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>K</span>
          </div>
          <h1
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace" }}
          >
            KeyForge
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <div className="text-center pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Local-first developer tool
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 leading-tight">
            One tool for{' '}
            <span className="gradient-text">all your API keys</span>
          </h2>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect your service accounts once, then provision fresh API keys
            for every new project in seconds. No cloud. No telemetry.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-xl font-mono text-sm shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
            >
              <span className="text-gray-400">$</span>
              <span className="text-gray-800">npx keyforge</span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">
                {copied ? 'Copied!' : 'Copy'}
              </span>
            </button>
          </div>

          <a
            href="https://github.com/manumarri-sudo/keyforge"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            View on GitHub &#8599;
          </a>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-5 mb-20">
          {[
            {
              step: '1',
              title: 'Connect',
              desc: 'Store your admin keys locally in your system keychain. One-time setup per service.',
              color: 'emerald',
            },
            {
              step: '2',
              title: 'Provision',
              desc: 'Create a new project and KeyForge generates fresh API keys via official APIs.',
              color: 'emerald',
            },
            {
              step: '3',
              title: 'Export',
              desc: 'Download your .env file or copy to clipboard. Ready to code in seconds.',
              color: 'emerald',
            },
          ].map((item) => (
            <div key={item.step} className="bg-white border border-gray-200 rounded-2xl p-6 card-hover">
              <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-sm font-bold text-emerald-600 mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-base">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Supported services */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Supported Services</h3>
            <p className="text-sm text-gray-500">Connect once, provision keys for every project</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {providers.map((p) => (
              <div key={p.name} className="bg-white border border-gray-200 rounded-xl overflow-hidden card-hover">
                <div className="h-1" style={{ backgroundColor: p.color }} />
                <div className="p-4 flex items-center gap-3">
                  <span className="text-xl">{p.icon}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">{p.name}</span>
                    {p.canCreate && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Auto-create
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-4 mb-20">
          {[
            { title: 'Local-first', desc: 'Credentials stay on your machine. System keychain with AES-256 fallback.', icon: '\u{1F512}' },
            { title: 'CLI + Web UI', desc: 'Use the terminal or the browser dashboard \u2014 both work with the same data.', icon: '\u{1F4BB}' },
            { title: 'Per-project keys', desc: 'OpenAI, Supabase, and Resend get fresh keys per project via their APIs.', icon: '\u{1F511}' },
            { title: 'Audit trail', desc: 'Every key creation, connection, and export is logged locally.', icon: '\u{1F4CB}' },
          ].map((f) => (
            <div key={f.title} className="flex gap-4 p-5 bg-white border border-gray-200 rounded-xl card-hover">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-1">{f.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick start */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-5">Quick Start</h3>
          <div className="space-y-3 font-mono text-sm">
            {[
              { cmd: 'git clone https://github.com/manumarri-sudo/keyforge.git', comment: '# clone' },
              { cmd: 'cd keyforge && npm install', comment: '# install' },
              { cmd: 'npm run dev', comment: '# launch on localhost:5173' },
            ].map((line) => (
              <div key={line.cmd} className="flex gap-3 items-center">
                <span className="text-gray-300">$</span>
                <span className="text-gray-700">{line.cmd}</span>
                <span className="text-gray-300 ml-auto hidden md:inline">{line.comment}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-12">
          KeyForge runs locally \u2014 this page is a preview. Clone the repo and run{' '}
          <code className="text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">npm run dev</code>{' '}
          to get started.
        </p>
      </main>
    </div>
  );
}

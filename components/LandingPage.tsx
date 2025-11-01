import React from 'react';

interface LandingPageProps {
  onStartAnalyzer: () => void;
  onLogin: () => void;
  isLoggedIn: boolean;
}

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Our Mission', href: '#mission' },
  { label: 'Testimonials', href: '#testimonials' },
];

const steps = [
  {
    label: '1. Paste Link',
    description: 'Drop in any article URL or snippet that needs a credibility gut-check.',
    icon: '🔗',
  },
  {
    label: '2. AI Analysis',
    description: 'Our ensemble models surface bias signals, rhetoric patterns, and supporting evidence.',
    icon: '🤖',
  },
  {
    label: '3. Get Report',
    description: 'Review an interactive briefing with confidence scores, fact comparisons, and AI-detection verdicts.',
    icon: '📄',
  },
];

const testimonials = [
  {
    quote:
      '“Veritas AI is an indispensable tool for my research. It helps me quickly assess the credibility of sources and has saved me countless hours.”',
    name: 'Dr. Alisha Grant',
    title: 'University Professor',
  },
  {
    quote:
      '“As a journalist, I need to verify information fast. Veritas AI’s bias detection is incredibly accurate and keeps my reporting balanced.”',
    name: 'Mark Chen',
    title: 'Investigative Journalist',
  },
  {
    quote:
      '“In a world of endless online content, it’s hard to know what to trust. Veritas AI gives me confidence in the news I read and share.”',
    name: 'Sarah Jenkins',
    title: 'Concerned Citizen',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onStartAnalyzer, onLogin, isLoggedIn }) => {
  return (
    <div className="relative space-y-24 text-white">
      <section className="text-center">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] text-white/60">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
            Uncover the truth in a world of noise.
          </h1>
          <p className="text-lg text-white/70">
            Veritas AI delivers instant, unbiased analysis for any article. Paste a link, and we dissect credibility, detect bias, and validate claims in real-time so you can act with confidence.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={onStartAnalyzer}
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-black shadow-lg shadow-primary/40 transition-transform hover:-translate-y-[2px] hover:bg-secondary"
            >
              Start analyzing
            </button>
            <button
              onClick={isLoggedIn ? onStartAnalyzer : onLogin}
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-8 py-3 text-base font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
            >
              {isLoggedIn ? 'Go to dashboard' : 'Sign up with Google'}
            </button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">How Veritas AI works</h2>
          <p className="mt-4 text-base text-white/60">
            Every report follows the same transparent workflow so you always understand what the AI sees—and why it reaches each conclusion.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map(step => (
            <div
              key={step.label}
              className="rounded-2xl border border-white/10 bg-[#0C0C0C] p-8 text-center shadow-lg shadow-black/50"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl">
                <span>{step.icon}</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">{step.label}</h3>
              <p className="mt-3 text-sm text-white/60">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="mission" className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-12 text-center shadow-inner shadow-black/60">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="text-3xl font-bold">Our mission</h2>
          <p className="text-base leading-relaxed text-white/70">
            We empower every reader to navigate the digital information landscape with clarity. By blending rigorous fact-checking, bias detection, and AI-authorship analysis, Veritas AI builds transparency into your daily news diet and promotes a healthier information ecosystem.
          </p>
        </div>
      </section>

      <section id="testimonials" className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">What our users say</h2>
          <p className="mt-4 text-base text-white/60">
            Trusted by researchers, journalists, and curious readers who demand accuracy.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map(testimonial => (
            <div
              key={testimonial.name}
              className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-[#0C0C0C] p-8 shadow-lg shadow-black/50"
            >
              <p className="text-sm leading-relaxed text-white/70">{testimonial.quote}</p>
              <div className="mt-8">
                <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                <p className="text-xs text-white/50">{testimonial.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-12 text-center shadow-2xl shadow-black/50">
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="text-3xl font-bold">Ready to investigate your next article?</h2>
          <p className="text-base text-white/70">
            It takes less than a minute to run your first report. Strengthen your digital literacy and share trustworthy narratives with your community.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={onStartAnalyzer}
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-black shadow-lg shadow-primary/40 transition-transform hover:-translate-y-[2px] hover:bg-secondary"
            >
              Launch the analyzer
            </button>
            {!isLoggedIn && (
              <button
                onClick={onLogin}
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-8 py-3 text-base font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Continue with Google
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

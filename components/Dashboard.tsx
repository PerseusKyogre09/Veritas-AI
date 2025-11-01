import React from 'react';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface DashboardProps {
    onNavigate: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-6 text-left shadow-xl shadow-primary/5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 dark:border-gray-800/60 dark:bg-gray-900/60 dark:shadow-black/20">
        <div className="absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300 group-hover:opacity-60 dark:bg-accent/20" />
        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/70 via-primary to-accent text-white shadow-lg shadow-primary/30">
            {icon}
        </div>
        <h3 className="relative mt-6 text-xl font-semibold text-dark transition-colors duration-200 dark:text-white">{title}</h3>
        <p className="relative mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
        <div className="relative mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
);


export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    return (
        <div className="relative">
            <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/60 p-10 text-center shadow-2xl shadow-primary/10 transition-colors duration-200 dark:border-gray-800/60 dark:bg-gray-900/70 dark:shadow-black/30">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 via-white/10 to-transparent dark:from-gray-900/60 dark:via-gray-900/10" />
                <div className="relative mx-auto max-w-3xl space-y-6">
                    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold tracking-[0.2em] uppercase text-primary dark:border-accent/30 dark:bg-accent/10 dark:text-accent">
                        Misinformation Intelligence
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-tight text-dark sm:text-5xl md:text-6xl dark:text-white">
                        Combat misinformation with AI-guided clarity
                    </h1>
                    <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                        Veritas AI distills complex narratives into trusted insight. Verify content, unpack manipulative framing, and strengthen your digital literacy—all in a single, elegant workspace.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                        <button
                            onClick={onNavigate}
                            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-7 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-2xl"
                        >
                            Start analyzing now
                        </button>
                        <a
                            href="#how-it-works"
                            className="inline-flex items-center rounded-full border border-primary/20 bg-white/80 px-6 py-3 text-base font-semibold text-primary transition-colors duration-200 hover:border-primary hover:text-primary dark:border-accent/30 dark:bg-gray-900/60 dark:text-accent"
                        >
                            Explore the workflow
                        </a>
                    </div>
                </div>
                <div className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-[480px] -translate-x-1/2 rounded-[56px] bg-primary/15 blur-3xl dark:bg-secondary/20" />
            </section>

            <section id="how-it-works" className="mt-16 space-y-10 text-center">
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight text-dark sm:text-4xl dark:text-white">
                        How Veritas AI guides your analysis
                    </h2>
                    <p className="mx-auto max-w-2xl text-base text-gray-600 dark:text-gray-300">
                        Each step is designed to surface clarity from noise, so you can evaluate stories with evidence, context, and confidence.
                    </p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <FeatureCard
                        icon={<MagnifyingGlassIcon className="h-6 w-6" />}
                        title="Analyze content"
                        description="Paste any snippet or link. Our models assess tone, rhetoric, and fact patterns to uncover misinformation markers."
                    />
                    <FeatureCard
                        icon={<LightBulbIcon className="h-6 w-6" />}
                        title="Understand AI insight"
                        description="Receive precise scoring, claim-level commentary, and transparent reasoning to ground your next move."
                    />
                    <FeatureCard
                        icon={<BookOpenIcon className="h-6 w-6" />}
                        title="Build critical literacy"
                        description="Track patterns, educate your community, and sharpen instincts with curated learning moments inside each report."
                    />
                </div>
            </section>
        </div>
    );
};

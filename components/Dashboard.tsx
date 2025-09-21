import React from 'react';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface DashboardProps {
    onNavigate: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
);


export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    return (
        <div className="text-center">
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-12 mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-primary dark:text-accent mb-4">
                    Combat Misinformation with Confidence
                </h1>
                <p className="text-lg text-gray-700 dark:text-gray-200 max-w-3xl mx-auto mb-8">
                    In an age of digital overload, Veritas AI is your trusted partner in navigating the complex information landscape. Our powerful AI tools help you detect fake news, understand manipulative techniques, and find the truth.
                </p>
                <button
                    onClick={onNavigate}
                    className="bg-accent text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-primary transition-transform transform hover:scale-105 duration-300 shadow-lg"
                >
                    Start Analyzing Now
                </button>
            </section>

            <section>
                <h2 className="text-3xl font-bold text-dark dark:text-white mb-8">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<MagnifyingGlassIcon className="h-6 w-6" />}
                        title="Analyze Content"
                        description="Paste a link or text from any source. Our AI analyzes it in seconds for signs of bias, manipulation, and factual inaccuracies."
                    />
                    <FeatureCard
                        icon={<LightBulbIcon className="h-6 w-6" />}
                        title="Get AI Explanations"
                        description="Receive a detailed breakdown of why a piece of content might be misleading, including a credibility score and analysis of specific claims."
                    />
                    <FeatureCard
                        icon={<BookOpenIcon className="h-6 w-6" />}
                        title="Build Critical Skills"
                        description="Learn to spot the tactics used in misinformation. Our tool not only checks facts but also educates, making you a more discerning reader."
                    />
                </div>
            </section>
        </div>
    );
};

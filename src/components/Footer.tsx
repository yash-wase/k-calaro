import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] mt-4">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-center md:justify-between text-sm">
          <div className="space-y-1 text-center md:text-left">
           
            <p className="text-xs md:text-sm opacity-80">
              K-CALRO: It's Your own personal Kcalories Monitor that helps you track your daily food intake, monitor calorie goals, and stay on a healthy diet with ease.
            </p>
          </div>
          <div className="text-center md:text-right text-xs md:text-sm">
            <span>Created by </span>
            <span className="font-semibold italic">
              Yash-Techs
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState } from "react";

const NAV_ITEMS = [
  { label: "What is a Prompt", href: "#what-is-prompt" },
  { label: "Resources", href: "#resources" },
  { label: "Skills", href: "#skills" },
  { label: "Extension", href: "#extension" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="section-container flex items-center justify-between h-16">
        <a
          href="/"
          className="flex items-center gap-2.5 font-bold text-lg tracking-tight"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white text-sm">
            W
          </span>
          <span className="hidden sm:inline">Write AI Prompt Better</span>
          <span className="sm:hidden">WAPB</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {item.label}
            </a>
          ))}
          <a
            href="https://github.com/tangzixuan/write-ai-prompt-better"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-opacity"
          >
            GitHub
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="section-container py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a
              href="https://github.com/tangzixuan/write-ai-prompt-better"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 px-4 py-2.5 rounded-lg text-sm font-medium text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-opacity"
            >
              GitHub
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

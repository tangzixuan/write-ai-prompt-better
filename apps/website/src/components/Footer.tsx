const FOOTER_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/tangzixuan/write-ai-prompt-better",
  },
  { label: "VSCode Marketplace", href: "#" },
  { label: "MIT License", href: "#" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="section-container py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-brand-600 text-white text-xs font-bold">
              W
            </span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Write AI Prompt Better
            </span>
          </div>

          <nav className="flex items-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <p className="text-sm text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} tangzixuan
          </p>
        </div>
      </div>
    </footer>
  );
}

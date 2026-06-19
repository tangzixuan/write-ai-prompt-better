const BENEFITS = [
  {
    title: "Right-Click to Collect",
    description:
      "Select text in the editor, terminal, or explorer and add it to your prompt with a right-click. No more copying and pasting between windows.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5"
        />
      </svg>
    ),
  },
  {
    title: "Structured Prompt Builder",
    description:
      "Organize your prompt with Background, Requirements, and Validation sections. Add skills, preset templates, and iterate until it's perfect.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
        />
      </svg>
    ),
  },
  {
    title: "Live Preview & Copy",
    description:
      "Preview your assembled Markdown prompt in real-time. One click to copy to clipboard, ready to paste into any AI coding assistant.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
        />
      </svg>
    ),
  },
  {
    title: "Works with Any AI Assistant",
    description:
      "Compatible with Claude Code, GitHub Copilot, Cursor, Cline, Windsurf, and any other AI coding tool that accepts text prompts.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
    ),
  },
  {
    title: "History & Templates",
    description:
      "Access your prompt history and save reusable templates. Build a library of effective prompts that you can reuse and improve over time.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Open Source",
    description:
      "MIT licensed and fully open source. Contribute on GitHub, suggest features, or fork it to build your own custom prompt workflow.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
        />
      </svg>
    ),
  },
];

export default function ExtensionPromo() {
  return (
    <section
      id="extension"
      className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-900/50"
    >
      <div className="section-container">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 mb-4">
            VSCode Extension
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Write Prompts{" "}
            <span className="gradient-text">Without Leaving Your Editor</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-gray-600 dark:text-gray-400">
            The <strong>write-ai-prompt-better</strong> VSCode extension makes
            prompt writing fast and structured. Right-click, collect context,
            assemble your prompt — all inside your editor.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="card">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                  {benefit.icon}
                </span>
                <h3 className="font-semibold text-sm">{benefit.title}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="https://github.com/tangzixuan/write-ai-prompt-better/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 9.924L9.387 12l8.617 2.489-4.861-2.498 4.861-4.88z" />
            </svg>
            Install Extension
          </a>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
            Free and open source. Works with VSCode 1.85.0+.
          </p>
        </div>
      </div>
    </section>
  );
}

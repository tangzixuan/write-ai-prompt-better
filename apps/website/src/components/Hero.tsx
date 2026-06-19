export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative section-container text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs sm:text-sm font-medium mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
          </span>
          VSCode Extension Available
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          Write{" "}
          <span className="gradient-text">Better AI Prompts</span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
          Master the art of prompt engineering. Learn how to craft clear,
          structured prompts that get AI coding assistants to deliver exactly
          what you need.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#what-is-prompt"
            className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm sm:text-base hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25"
          >
            Start Learning
          </a>
          <a
            href="#extension"
            className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm sm:text-base hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Get the Extension →
          </a>
        </div>

        {/* Code snippet preview */}
        <div className="mt-16 max-w-xl mx-auto">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden shadow-sm">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-gray-400 font-mono">
                prompt.md
              </span>
            </div>
            <div className="p-4 font-mono text-xs sm:text-sm text-left text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="text-gray-400">## Background</span>
              {"\n"}I'm building a REST API with Node.js...
              {"\n"}
              {"\n"}
              <span className="text-gray-400">## Requirements</span>
              {"\n"}Implement rate limiting middleware...
              {"\n"}
              {"\n"}
              <span className="text-gray-400">## Validation</span>
              {"\n"}- All tests must pass
              {"\n"}- Follow the existing code style
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

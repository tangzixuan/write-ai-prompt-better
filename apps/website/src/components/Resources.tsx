const RESOURCES = [
  {
    title: "prompts.chat",
    description:
      "A curated collection of awesome ChatGPT prompts. Browse community-shared prompts for inspiration and learn how experts structure their instructions.",
    url: "https://github.com/f/awesome-chatgpt-prompts",
    tag: "Community",
  },
  {
    title: "Awesome Prompts",
    description:
      "A comprehensive directory of prompt engineering resources, tools, and examples. Covers multiple AI models and use cases.",
    url: "https://github.com/ai-boost/awesome-prompts",
    tag: "Directory",
  },
  {
    title: "System Prompts & Models",
    description:
      "Explore real system prompts used by popular AI tools and models. Understand how production AI systems are configured and instructed.",
    url: "https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools",
    tag: "Reference",
  },
];

export default function Resources() {
  return (
    <section id="resources" className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-900/50">
      <div className="section-container">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Learning{" "}
            <span className="gradient-text">Resources</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-gray-600 dark:text-gray-400">
            Discover the best community resources for mastering prompt
            engineering — from curated examples to in-depth references.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESOURCES.map((resource) => (
            <a
              key={resource.url}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card group block hover:border-brand-300 dark:hover:border-brand-700 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {resource.title}
                </h3>
                <span className="shrink-0 text-xs font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {resource.tag}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                {resource.description}
              </p>
              <div className="flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400">
                <span>Visit Resource</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

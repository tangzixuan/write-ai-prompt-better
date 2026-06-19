const FEATURES = [
  {
    title: "Discover Skills",
    description:
      "Skills extend what AI assistants can do. Browse hundreds of community-created skills for development, data analysis, content creation, and more.",
  },
  {
    title: "Install in One Click",
    description:
      "Skills are easy to install and configure. Find the right skill for your workflow and start using it immediately with your AI assistant.",
  },
  {
    title: "Community Driven",
    description:
      "The skills ecosystem is open and community-driven. Share your own skills, improve existing ones, and learn from how others build effective AI instructions.",
  },
];

export default function SkillsSection() {
  return (
    <section id="skills" className="py-20 sm:py-28">
      <div className="section-container">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-4">
            Discover
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Find & Use{" "}
            <span className="gradient-text">AI Skills</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-gray-600 dark:text-gray-400">
            <a
              href="https://www.skills.sh/"
              target="_blank"
              rel="noopener noreferrer"
              className="link font-medium"
            >
              skills.sh
            </a>{" "}
            is the go-to platform for discovering, sharing, and installing AI assistant skills.
            Level up your AI workflow with specialized capabilities.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card">
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="https://www.skills.sh/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25"
          >
            Browse Skills →
          </a>
        </div>
      </div>
    </section>
  );
}

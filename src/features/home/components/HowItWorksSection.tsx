import SectionGlow from './SectionGlow.tsx';

interface Step {
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    title: 'Shape the structure',
    description:
      'Randomize it, sort it, insert or remove values, so the run works on data you chose rather than a fixed example.',
  },
  {
    title: 'Step through the code',
    description:
      'Press Run, then Next step. The line being run lights up while the call stack and the memory of each call update beside it.',
  },
  {
    title: 'Watch the structure move',
    description:
      'Elements shift, nodes appear, links are redrawn. The canvas animates the change rather than cutting to the result.',
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-border/60 relative border-t">
      <SectionGlow />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <h2 className="font-en-display text-foreground max-w-2xl text-3xl font-semibold lg:text-4xl">
          Three moves, and the algorithm explains itself
        </h2>

        <ol className="mt-10 grid gap-3 md:grid-cols-3 lg:mt-12">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="lit-surface relative rounded-2xl p-5 sm:p-6"
            >
              <span className="font-code text-accent text-sm">
                {String(index + 1).padStart(2, '0')}
              </span>

              <h3 className="font-en-display text-card-foreground mt-3 text-lg font-semibold">
                {step.title}
              </h3>

              <p className="font-en text-muted-foreground mt-2 text-sm leading-relaxed">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorksSection;

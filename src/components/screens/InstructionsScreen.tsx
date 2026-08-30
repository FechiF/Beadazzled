'use client';

export function InstructionsScreen() {
  const steps = [
    'Set the voice, exercise time, and word interval.',
    'Place the beads along the string as instructed.',
    'Start the exercise.',
    'Listen for each word.',
    'Look at the bead with the mentioned color.',
    'Pause or restart when needed.',
  ];

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-8">
      <h2 className="mb-6 text-center text-3xl font-black">Instructions</h2>

      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li
            key={step}
            className="flex items-start gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-lg font-black text-white">
              {index + 1}
            </span>

            <span className="pt-1 text-lg font-bold leading-7 text-slate-700">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </main>
  );
}

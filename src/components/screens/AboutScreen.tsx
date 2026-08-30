'use client';

export function AboutScreen() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-8">
      <h2 className="mb-6 text-center text-3xl font-black">About</h2>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-lg leading-8 text-slate-700">
          Beadazzled plays spoken words at regular intervals during a Brock
          string exercise.
        </p>

        <p className="mt-5 text-lg leading-8 text-slate-700">
          The words give you a simple sound cue while you change your eye focus
          during the exercise.
        </p>

        <p className="mt-5 text-sm leading-6 text-slate-500">
          Use the exercise as instructed by your eye care professional.
        </p>
      </div>
    </main>
  );
}

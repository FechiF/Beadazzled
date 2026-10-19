export function Logo() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center  gap-3 rounded-2xl px-3 py-2">
      <BeadString isReversed />

      <div className="text-3xl text-stone-500 font-black tracking-tight">
        Beadazzled
      </div>

      <BeadString />
    </div>
  );
}

function BeadString({ isReversed }: { isReversed?: boolean }) {
  return (
    <span
      className={`flex gap-1 ${isReversed ? 'flex-row-reverse' : ''}`}
      aria-hidden="true"
    >
      <span className="h-5 w-5 rounded-full bg-red-500" />
      <span className="h-5 w-5 rounded-full bg-orange-400" />
      <span className="h-5 w-5 rounded-full bg-yellow-400" />
      <span className="h-5 w-5 rounded-full bg-green-500" />
      <span className="h-5 w-5 rounded-full bg-blue-500" />
    </span>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2">
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-5 w-5 rounded-full bg-red-500" />
        <span className="h-5 w-5 rounded-full bg-orange-400" />
        <span className="h-5 w-5 rounded-full bg-yellow-400" />
        <span className="h-5 w-5 rounded-full bg-green-500" />
        <span className="h-5 w-5 rounded-full bg-blue-500" />
      </span>

      <span className="text-3xl text-stone-500 font-black tracking-tight">
        Beadazzled
      </span>
    </div>
  );
}

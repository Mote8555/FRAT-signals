export default function Skeleton() {
  return (
    <div className="bg-gray-900 rounded-xl border border-slate-800/60 p-5 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-24 bg-gray-800 rounded" />
          <div className="h-5 w-16 bg-gray-800 rounded-full" />
        </div>
        <div className="h-5 w-32 bg-gray-800 rounded" />
      </div>

      <div className="h-1 w-full bg-gray-800 rounded-sm mb-5" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-900 rounded-[10px] border border-slate-800/60 p-4 flex flex-col gap-3"
          >
            <div className="flex justify-between">
              <div className="h-4 w-10 bg-gray-800 rounded" />
              <div className="h-4 w-16 bg-gray-800 rounded-full" />
            </div>
            <div className="flex items-center justify-center py-2">
              <div className="h-10 w-20 bg-gray-800 rounded-md" />
            </div>
            <div className="h-8 w-full bg-gray-800 rounded" />
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="h-2.5 w-8 bg-gray-800 rounded mb-1" />
                <div className="h-4 w-16 bg-gray-800 rounded" />
              </div>
              <div className="flex-1">
                <div className="h-2.5 w-6 bg-gray-800 rounded mb-1" />
                <div className="h-4 w-14 bg-gray-800 rounded" />
              </div>
              <div className="flex-1">
                <div className="h-2.5 w-6 bg-gray-800 rounded mb-1" />
                <div className="h-4 w-14 bg-gray-800 rounded" />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-gray-800 rounded-full" />
            </div>
            <div className="h-5 w-full bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

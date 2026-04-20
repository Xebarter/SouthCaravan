export default function LoadingHome() {
  return (
    <div className="bg-background">
      <section className="px-4 md:px-6 pt-4 pb-8 md:pt-6 md:pb-10">
        <div className="max-w-[1500px] mx-auto space-y-6">
          <div className="h-6 w-52 rounded-full bg-slate-200 animate-pulse" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="aspect-[16/10] bg-slate-200 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-slate-200 animate-pulse" />
                <div className="flex items-center justify-between pt-1">
                  <div className="h-6 w-24 rounded-full bg-slate-200 animate-pulse" />
                  <div className="h-6 w-20 rounded bg-slate-200 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-slate-200 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-4/5 rounded bg-slate-200 animate-pulse" />
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-24 rounded-full bg-slate-200 animate-pulse" />
                      <div className="h-5 w-16 rounded bg-slate-200 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="h-11 w-40 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-11 w-44 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-4">
        <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center">
            <div className="md:col-span-8 order-1 md:order-2">
              <div className="aspect-[1600/450] w-full rounded-xl bg-slate-200 animate-pulse" />
            </div>
            <div className="md:col-span-4 order-2 md:order-1 space-y-2">
              <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
              <div className="h-7 w-3/4 rounded bg-slate-200 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-slate-200 animate-pulse" />
              <div className="flex gap-2 pt-1">
                <div className="h-9 w-28 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-9 w-28 rounded-lg bg-slate-200 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-7">
        <div className="max-w-[1500px] mx-auto bg-white border border-slate-200 rounded-xl p-3 md:p-4 shadow-sm">
          <div className="h-4 w-52 rounded bg-slate-200 animate-pulse mb-2" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 w-36 rounded-full bg-slate-200 animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 py-6 md:py-8 bg-background">
        <div className="max-w-[1500px] mx-auto space-y-5">
          {Array.from({ length: 2 }).map((_, sectionIdx) => (
            <div
              key={sectionIdx}
              className="bg-white border border-slate-200 rounded-xl px-4 md:px-6 py-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-56 rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm"
                  >
                    <div className="aspect-square bg-slate-200 animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 w-4/5 rounded bg-slate-200 animate-pulse" />
                      <div className="h-5 w-1/2 rounded bg-slate-200 animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-slate-200 animate-pulse" />
                    </div>
                    <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                      <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
                      <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


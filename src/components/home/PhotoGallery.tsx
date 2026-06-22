const tiles = [
  "Campus Building",
  "Workshop",
  "Laboratory",
  "Library",
  "Annual Function",
  "Sports Day"= src={s5Asset.url},
];

export function PhotoGallery() {
  return (
    <section>
      <h3 className="text-2xl font-bold text-[color:var(--navy)] mb-4">Campus Life</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tiles.map((t, i) => (
          <div
            key={t}
            className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-[color:var(--navy)] to-[color:var(--navy-dark)] group cursor-pointer"
          >
            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-5xl">
              {i + 1}
            </div>
            <div className="absolute inset-0 bg-[color:var(--navy)]/0 group-hover:bg-[color:var(--navy)]/80 transition-all flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 font-semibold">
                {t}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import s6Asset from "@/assets/s6.jpg.asset.json";

const tiles = [
  {
    title: "Campus Building",
    image: s6Asset.url,
  },
  {
    title: "Workshop",
    image: lab.url,
  },
  {
    title: "Laboratory",
    image: seminar.url,
  },
  {
    title: "Library",
    image: vanmahoatsav.url,
  },
  {
    title: "Annual Function",
    image: event.url,
  },
  {
    title: "Sports Day",
    image: event.url,
  },
];

export function PhotoGallery() {
  return (
    <section>
      <h3 className="text-2xl font-bold text-[color:var(--navy)] mb-4">Campus Life</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <div key={tile.title} className="relative aspect-[4/3] rounded-lg overflow-hidden group cursor-pointer">
            <img src={tile.image} alt={tile.title} className="w-full h-full object-cover" />

            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/60 transition-all flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 font-semibold">{tile.title}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

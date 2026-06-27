import s1Asset from "@/assets/s1.png.asset.json";
import labAsset from "@/assets/lab.jpeg.asset.json";
import seminarAsset from "@/assets/seminar.jpeg.asset.json";
import vanmahoatsavAsset from "@/assets/vanmahoatsav.jpeg.asset.json";
import eventAsset from "@/assets/event.jpeg.asset.json";
import s5Asset from "@/assets/s5.jpeg.asset.json";

const tiles = [
  { title: "Campus", image: s1Asset.url },
  { title: "Laboratory", image: labAsset.url },
  { title: "Seminars", image: seminarAsset.url },
  { title: "Events", image: vanmahoatsavAsset.url },
  { title: "Sports", image: eventAsset.url },
  { title: "Students Events", image: s5Asset.url },
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

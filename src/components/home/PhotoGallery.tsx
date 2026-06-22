import s6Asset from "@/assets/s6.jpg.asset.json";
import labAsset from "@/assets/lab.jpeg.asset.json";
import seminarAsset from "@/assets/seminar.jpeg.asset.json";
import vanmahoatsavAsset from "@/assets/vanmahoatsav.jpeg.asset.json";
import eventAsset from "@/assets/event.jpeg.asset.json";
import s5Asset from "@/assets/s5.jpeg.asset.json";
import s3_2Asset from "@/assets/s3-2.jpeg.asset.json";

const tiles = [
  { title: "Campus Building", image: s6Asset.url },
  { title: "Workshop", image: labAsset.url },
  { title: "Laboratory", image: seminarAsset.url },
  { title: "Tree Plantation", image: vanmahoatsavAsset.url },
  { title: "Annual Function", image: eventAsset.url },
  { title: "Cultural Day", image: s5Asset.url },
  { title: "Achievements", image: s3_2Asset.url },
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

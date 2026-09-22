import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const pics = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const list = pics.length ? pics : [""];
  const current = list[Math.min(active, list.length - 1)];
  const go = (dir: number) => setActive((a) => (a + dir + list.length) % list.length);

  return (
    <div data-testid="product-gallery">
      <div className="relative rounded-2xl overflow-hidden border border-[#E7E0D6] bg-[#F3EDE4]">
        {current ? (
          <img
            src={current}
            alt={alt}
            className="w-full object-cover aspect-square"
            data-testid="gallery-main-image"
          />
        ) : (
          <div className="w-full aspect-square" />
        )}
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-full bg-white/85 text-stone-800 shadow-sm transition-transform duration-200 hover:scale-105"
              data-testid="gallery-prev-button"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-full bg-white/85 text-stone-800 shadow-sm transition-transform duration-200 hover:scale-105"
              data-testid="gallery-next-button"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {list.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" data-testid="gallery-thumbnails">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 size-16 rounded-lg overflow-hidden border transition-colors duration-200 ${
                i === active ? "border-amber-700" : "border-[#E7E0D6]"
              }`}
              data-testid={`gallery-thumb-${i}`}
            >
              <img src={src} alt={`${alt} ${i + 1}`} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

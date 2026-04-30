import Link from "next/link";
import { properties, type Property } from "@/lib/property";

export default function Home() {
  const featured = properties[0];
  const heroImage =
    featured.rooms.find((r) => r.id === featured.startRoomId)?.panorama ??
    featured.rooms[0].panorama;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="relative h-[80vh] min-h-[520px] w-full overflow-hidden">
        <img
          src={heroImage}
          alt={featured.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-neutral-950" />

        <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />
            <span className="text-sm font-semibold tracking-wide">
              Lythwood
            </span>
          </div>
          <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-widest text-white/70">
            Demo
          </span>
        </header>

        <div className="relative z-10 mx-auto flex h-[calc(80vh-72px)] min-h-[440px] max-w-5xl flex-col items-start justify-end px-6 pb-12 md:px-10 md:pb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-lime-400">
            Featured Listing
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">
            {featured.name}
          </h1>
          <p className="mt-2 text-sm text-white/70 md:text-base">
            {featured.address}
          </p>
          <p className="mt-6 max-w-2xl text-base text-white/80 md:text-lg">
            {featured.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={`/tour/${featured.id}`}
              className="rounded-full bg-lime-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-lime-300"
            >
              Take the Virtual Tour →
            </Link>
            <a
              href="#listings"
              className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/10"
            >
              All Properties
            </a>
          </div>
        </div>
      </section>

      <section
        id="listings"
        className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24"
      >
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold md:text-3xl">Properties</h2>
            <p className="mt-2 text-sm text-white/60">
              Choose a property to step inside.
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/50">
            {properties.length} listings
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-white/50 md:px-10">
        Lythwood · Virtual property tours
      </footer>
    </main>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const cover =
    property.rooms.find((r) => r.id === property.startRoomId)?.panorama ??
    property.rooms[0].panorama;
  return (
    <Link
      href={`/tour/${property.id}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/30"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={cover}
          alt={property.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[10px] uppercase tracking-widest text-lime-400">
            {property.rooms.length} rooms
          </p>
          <h3 className="mt-1 text-lg font-semibold">{property.name}</h3>
          <p className="text-xs text-white/70">{property.address}</p>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs text-white/60 line-clamp-1">
          {property.description}
        </span>
        <span className="ml-3 shrink-0 text-xs font-medium text-lime-400">
          Tour →
        </span>
      </div>
    </Link>
  );
}

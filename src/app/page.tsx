import Link from "next/link";
import { sampleProperty } from "@/lib/property";

export default function Home() {
  const property = sampleProperty;
  const heroImage = property.rooms.find((r) => r.id === property.startRoomId)
    ?.panorama ?? property.rooms[0].panorama;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="relative h-[80vh] min-h-[520px] w-full overflow-hidden">
        <img
          src={heroImage}
          alt={property.name}
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
            {property.name}
          </h1>
          <p className="mt-2 text-sm text-white/70 md:text-base">
            {property.address}
          </p>
          <p className="mt-6 max-w-2xl text-base text-white/80 md:text-lg">
            {property.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/tour"
              className="rounded-full bg-lime-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-lime-300"
            >
              Take the Virtual Tour →
            </Link>
            <a
              href="#details"
              className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/10"
            >
              View Details
            </a>
          </div>
        </div>
      </section>

      <section
        id="details"
        className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-24"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Rooms" value={String(property.rooms.length)} />
          <Stat label="Type" value="Residential" />
          <Stat label="Location" value="Cape Town" />
          <Stat label="Tour" value="Interactive 3D" />
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-semibold md:text-3xl">Inside the home</h2>
          <p className="mt-2 text-sm text-white/60">
            Step into any room from the virtual tour, or preview them below.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {property.rooms.map((room) => (
              <div
                key={room.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={room.panorama}
                    alt={room.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium">{room.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-white/50">
                    {room.hotspots.length} link
                    {room.hotspots.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-lime-400/10 to-transparent p-8 md:p-12">
          <h3 className="text-xl font-semibold md:text-2xl">
            Walk through it yourself
          </h3>
          <p className="mt-2 max-w-xl text-sm text-white/70 md:text-base">
            Drag to look around, scroll to zoom, and click chevrons on the floor
            to move between rooms.
          </p>
          <Link
            href="/tour"
            className="mt-6 inline-flex rounded-full bg-lime-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-lime-300"
          >
            Launch Virtual Tour →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-white/50 md:px-10">
        Lythwood Residence · Demo virtual tour
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
      <p className="text-[10px] uppercase tracking-widest text-white/50">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

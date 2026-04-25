import Link from "next/link";
import { PanoramaViewer } from "@/components/PanoramaViewer";

export default function TourPage() {
  return (
    <main className="relative flex-1 w-full h-screen bg-black">
      <Link
        href="/"
        className="absolute left-4 top-4 z-20 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-md hover:bg-white/20 transition"
      >
        ← Back
      </Link>
      <PanoramaViewer />
    </main>
  );
}

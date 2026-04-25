export type Hotspot = {
  to: string;
  label: string;
  yaw: number;
  pitch: number;
  distance?: number;
  arrowRotation?: number;
};

export const AVAILABLE_IMAGES: { url: string; name: string }[] = [
  { url: "/panoramas/lythwood_lounge.jpg", name: "Lythwood Lounge" },
  { url: "/panoramas/lythwood_room.jpg", name: "Lythwood Bedroom" },
  { url: "/panoramas/entrance_hall.jpg", name: "Entrance Hall" },
  { url: "/panoramas/studio_small_03.jpg", name: "Studio" },
  { url: "/panoramas/museum_of_history.jpg", name: "Outdoor / Gallery" },
];

export type Room = {
  id: string;
  name: string;
  panorama: string;
  initialYaw?: number;
  hotspots: Hotspot[];
};

export type Property = {
  id: string;
  name: string;
  address: string;
  description: string;
  rooms: Room[];
  startRoomId: string;
};

const D = Math.PI / 180;

export const sampleProperty: Property = {
  id: "lythwood-residence",
  name: "Lythwood Residence",
  address: "12 Birchwood Lane, Cape Town",
  description:
    "A modern 4-room residential property featuring an open lounge, a cozy bedroom, an entrance hall, and a private studio.",
  startRoomId: "lounge",
  rooms: [
    {
      id: "lounge",
      name: "Lounge",
      panorama: "/panoramas/lythwood_lounge.jpg",
      initialYaw: 0,
      hotspots: [
        { to: "entrance", label: "Entrance Hall", yaw: 70 * D, pitch: -30 * D },
        { to: "bedroom", label: "Bedroom", yaw: -90 * D, pitch: -30 * D },
        { to: "studio", label: "Studio", yaw: 180 * D, pitch: -30 * D },
      ],
    },
    {
      id: "bedroom",
      name: "Bedroom",
      panorama: "/panoramas/lythwood_room.jpg",
      hotspots: [
        { to: "lounge", label: "Back to Lounge", yaw: 90 * D, pitch: -30 * D },
        { to: "entrance", label: "Entrance Hall", yaw: -45 * D, pitch: -30 * D },
      ],
    },
    {
      id: "entrance",
      name: "Entrance Hall",
      panorama: "/panoramas/entrance_hall.jpg",
      hotspots: [
        { to: "lounge", label: "Lounge", yaw: -110 * D, pitch: -30 * D },
        { to: "bedroom", label: "Bedroom", yaw: 45 * D, pitch: -30 * D },
        { to: "gallery", label: "Gallery", yaw: 160 * D, pitch: -30 * D },
      ],
    },
    {
      id: "studio",
      name: "Studio",
      panorama: "/panoramas/studio_small_03.jpg",
      hotspots: [
        { to: "lounge", label: "Lounge", yaw: 0 * D, pitch: -30 * D },
      ],
    },
    {
      id: "gallery",
      name: "Gallery",
      panorama: "/panoramas/museum_of_history.jpg",
      hotspots: [
        { to: "entrance", label: "Entrance Hall", yaw: 0 * D, pitch: -30 * D },
      ],
    },
  ],
};

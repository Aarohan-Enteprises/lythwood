export type Hotspot = {
  to: string;
  label: string;
  yaw: number;
  pitch: number;
  distance?: number;
};

export type Room = {
  id: string;
  name: string;
  panorama: string;
  thumb?: string;
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

const BASE = (process.env.NEXT_PUBLIC_PANORAMA_BASE_URL ?? "").replace(/\/$/, "");

function panoramaUrl(folder: string, file: string): string {
  if (BASE) return `${BASE}/${folder}/${file}`;
  return `/panoramas/${folder}/${file}`;
}

function thumbUrl(folder: string, file: string): string {
  const webp = file.replace(/\.jpe?g$/i, ".webp");
  if (BASE) return `${BASE}/thumbs/${folder}/${webp}`;
  return `/thumbs/${folder}/${webp}`;
}

export const HERO_IMAGE_URL = BASE ? `${BASE}/hero/main.webp` : "/hero/main.webp";

type RoomTemplate = Omit<Room, "panorama" | "thumb"> & { file: string };
type PropertyTemplate = {
  baseId: string;
  baseName: string;
  address: string;
  description: string;
  folder: string;
  startRoomId: string;
  rooms: RoomTemplate[];
};

const lythwoodTemplate: PropertyTemplate = {
  baseId: "lythwood-residence",
  baseName: "Lythwood Residence",
  address: "12 Birchwood Lane, Cape Town",
  description:
    "A modern 4-room residential property featuring an open lounge, a cozy bedroom, an entrance hall, and a private studio.",
  folder: "lythwood",
  startRoomId: "entrance",
  rooms: [
    {
      id: "lounge",
      name: "Lounge",
      file: "lounge.jpg",
      initialYaw: 0,
      hotspots: [
        { to: "entrance", label: "To Entrance Hall", yaw: -1.0140715725990819, pitch: -0.3969961590880365, distance: 5.962930947190773 },
        { to: "studio", label: "To Studio", yaw: 0.5711373621074277, pitch: -0.2922347467570833, distance: 8.309839585743577 },
      ],
    },
    {
      id: "entrance",
      name: "Entrance Hall",
      file: "entrance_hall.jpg",
      hotspots: [
        { to: "gallery", label: "Outside", yaw: 0.7008870650889057, pitch: -0.42740522780731066, distance: 5.488664466662418 },
        { to: "lounge", label: "To Lounge", yaw: -2.406448135314341, pitch: -0.9868638466737635, distance: 4.8 },
        { to: "studio", label: "To Studio", yaw: -0.8626102385298633, pitch: -0.4025101163754395, distance: 5.8719191852810155 },
        { to: "bedroom", label: "To Bedroom", yaw: 2.390687244300054, pitch: -0.41359815705678304, distance: 5.695853438265766 },
      ],
    },
    {
      id: "studio",
      name: "Studio",
      file: "studio.jpg",
      hotspots: [
        { to: "entrance", label: "To Entrance Hall", yaw: 0, pitch: -0.5235987755982988, distance: 2.5 },
      ],
    },
    {
      id: "gallery",
      name: "Gallery",
      file: "gallery.jpg",
      hotspots: [
        { to: "entrance", label: "To Entrance Hall", yaw: 1.9023863824190428, pitch: -0.4300095670185122, distance: 5.4509862243658445 },
      ],
    },
    {
      id: "bedroom",
      name: "Bedroom",
      file: "bedroom.jpg",
      hotspots: [
        { to: "entrance", label: "To Entrance Hall", yaw: 0.39973320767532794, pitch: -0.49622294927264055, distance: 4.617587411367505 },
        { to: "lounge", label: "To Lounge", yaw: -0.1268509425294596, pitch: -0.49624425000053357, distance: 4.617352498174848 },
      ],
    },
  ],
};

const propertyTwoTemplate: PropertyTemplate = {
  baseId: "property-two",
  baseName: "Property Two",
  address: "Sample Address",
  description:
    "A 6-room property tour: entrance, living area, two bathrooms, and two bedrooms.",
  folder: "property2",
  startRoomId: "entrance",
  rooms: [
    {
      id: "entrance",
      name: "Entrance",
      file: "entrance.jpg",
      hotspots: [
        { to: "living-area", label: "To Living Area", yaw: -1.5211717027810927, pitch: -0.5210569488759934, distance: 4.3556577420017355 },
      ],
    },
    {
      id: "living-area",
      name: "Living Area",
      file: "living_area.jpg",
      hotspots: [
        { to: "bedroom-1", label: "To Bedroom 1", yaw: -2.7205584992463945, pitch: -0.5595895993824531, distance: 5 },
        { to: "entrance", label: "To Entrance", yaw: 2.7715210036504243, pitch: -0.6285822865380095, distance: 3.439046938699259 },
        { to: "bedroom-2", label: "To Bedroom 2", yaw: -1.9209252433142503, pitch: -0.7471247670342103, distance: 2.6990838145535894 },
      ],
    },
    {
      id: "bathroom-1",
      name: "Bathroom 1",
      file: "bathroom_1.jpg",
      hotspots: [
        { to: "bedroom-1", label: "To Bedroom 1", yaw: 1.1511149937095382, pitch: -0.8747513906644315, distance: 2.0888745268637674 },
      ],
    },
    {
      id: "bedroom-1",
      name: "Bedroom 1",
      file: "bedroom_1.jpg",
      hotspots: [
        { to: "living-area", label: "To Living", yaw: 0.6157653513151794, pitch: -0.11582834214637758, distance: 9 },
        { to: "bathroom-1", label: "To Bathroom 1", yaw: 0.16364855741592177, pitch: -0.36391398089406884, distance: 7.7 },
      ],
    },
    {
      id: "bathroom-2",
      name: "Bathroom 2",
      file: "bathroom_2.jpg",
      hotspots: [
        { to: "bedroom-2", label: "To Bedroom 2", yaw: 0.4828173983723745, pitch: -0.7528717812598054, distance: 2.668160882812399 },
      ],
    },
    {
      id: "bedroom-2",
      name: "Bedroom 2",
      file: "bedroom_2.jpg",
      hotspots: [
        { to: "living-area", label: "To Living Area", yaw: -1.6645172392472314, pitch: -0.39701314043640257, distance: 5.962646986087029 },
        { to: "bathroom-2", label: "To Bathroom 2", yaw: -2.453047605771621, pitch: -0.3528858884962945, distance: 7.5 },
      ],
    },
  ],
};

const VARIANTS_PER_TEMPLATE = 25;

function buildProperty(template: PropertyTemplate, index: number): Property {
  const folder = index === 1 ? template.folder : `${template.folder}-${index}`;
  const id = index === 1 ? template.baseId : `${template.baseId}-${index}`;
  const name = index === 1 ? template.baseName : `${template.baseName} #${index}`;
  return {
    id,
    name,
    address: template.address,
    description: template.description,
    startRoomId: template.startRoomId,
    rooms: template.rooms.map((r) => ({
      id: r.id,
      name: r.name,
      panorama: panoramaUrl(folder, r.file),
      thumb: thumbUrl(folder, r.file),
      initialYaw: r.initialYaw,
      hotspots: r.hotspots,
    })),
  };
}

function buildAll(template: PropertyTemplate): Property[] {
  return Array.from({ length: VARIANTS_PER_TEMPLATE }, (_, i) =>
    buildProperty(template, i + 1)
  );
}

export const properties: Property[] = [
  ...buildAll(lythwoodTemplate),
  ...buildAll(propertyTwoTemplate),
];

export const AVAILABLE_IMAGES: { url: string; name: string; propertyId: string }[] =
  properties.flatMap((p) =>
    p.rooms.map((r) => ({ url: r.panorama, name: r.name, propertyId: p.id }))
  );

export function imagesForProperty(propertyId: string) {
  return AVAILABLE_IMAGES.filter((img) => img.propertyId === propertyId);
}

export function getProperty(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}

export const sampleProperty = properties[0];

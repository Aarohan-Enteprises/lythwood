export type Hotspot = {
  to: string;
  label: string;
  yaw: number;
  pitch: number;
  distance?: number;
  arrowRotation?: number;
};

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

export const sampleProperty: Property = {
  id: "lythwood-residence",
  name: "Lythwood Residence",
  address: "12 Birchwood Lane, Cape Town",
  description:
    "A modern 4-room residential property featuring an open lounge, a cozy bedroom, an entrance hall, and a private studio.",
  startRoomId: "entrance",
  rooms: [
    {
      id: "lounge",
      name: "Lounge",
      panorama: "/panoramas/lythwood_lounge.jpg",
      initialYaw: 0,
      hotspots: [
        {
          to: "entrance",
          label: "To Entrance Hall",
          yaw: -1.0140715725990819,
          pitch: -0.3969961590880365,
          distance: 5.962930947190773,
          arrowRotation: 3.141592653589793,
        },
        {
          to: "studio",
          label: "To Studio",
          yaw: 0.5711373621074277,
          pitch: -0.2922347467570833,
          distance: 8.309839585743577,
          arrowRotation: 2.5307274153917776,
        },
      ],
    },
    {
      id: "entrance",
      name: "Entrance Hall",
      panorama: "/panoramas/entrance_hall.jpg",
      hotspots: [
        {
          to: "gallery",
          label: "Outside",
          yaw: 0.7008870650889057,
          pitch: -0.42740522780731066,
          distance: 5.488664466662418,
          arrowRotation: 3.0543261909900763,
        },
        {
          to: "lounge",
          label: "To Lounge",
          yaw: -2.406448135314341,
          pitch: -0.9868638466737635,
          distance: 4.8,
          arrowRotation: 3.141592653589793,
        },
        {
          to: "studio",
          label: "To Studio",
          yaw: -0.8626102385298633,
          pitch: -0.4025101163754395,
          distance: 5.8719191852810155,
          arrowRotation: 3.141592653589793,
        },
        {
          to: "bedroom",
          label: "To Bedroom",
          yaw: 2.390687244300054,
          pitch: -0.41359815705678304,
          distance: 5.695853438265766,
          arrowRotation: 3.141592653589793,
        },
      ],
    },
    {
      id: "studio",
      name: "Studio",
      panorama: "/panoramas/studio_small_03.jpg",
      hotspots: [
        {
          to: "entrance",
          label: "To Entrance Hall",
          yaw: 0,
          pitch: -0.5235987755982988,
          distance: 2.5,
          arrowRotation: 2.9670597283903604,
        },
      ],
    },
    {
      id: "gallery",
      name: "Gallery",
      panorama: "/panoramas/museum_of_history.jpg",
      hotspots: [
        {
          to: "entrance",
          label: "To Entrance Hall",
          yaw: 1.9023863824190428,
          pitch: -0.4300095670185122,
          distance: 5.4509862243658445,
          arrowRotation: 3.141592653589793,
        },
      ],
    },
    {
      id: "bedroom",
      name: "Bedroom",
      panorama: "/panoramas/lythwood_room.jpg",
      hotspots: [
        {
          to: "entrance",
          label: "To Entrance Hall",
          yaw: 0.39973320767532794,
          pitch: -0.49622294927264055,
          distance: 4.617587411367505,
          arrowRotation: 3.141592653589793,
        },
        {
          to: "lounge",
          label: "To Lounge",
          yaw: -0.1268509425294596,
          pitch: -0.49624425000053357,
          distance: 4.617352498174848,
          arrowRotation: 2.705260340591211,
        },
      ],
    },
  ],
};

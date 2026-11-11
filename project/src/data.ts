import type { Room } from "./types";

export const rooms: Room[] = [
  {
    id: "eng-101",
    name: "Engineering Hall 101",
    building: "Engineering Block",
    capacity: 40,
    equipment: ["projector", "whiteboard", "audio-system"],
    blocked: false,
    bookings: [
      { start: 540, end: 600, title: "Circuits I Lecture", bookedBy: "Prof. Lin" },
      { start: 780, end: 870, title: "Robotics Lab", bookedBy: "Prof. Okoye" },
      { start: 1080, end: 1140, title: "Office Hours", bookedBy: "Prof. Lin" },
    ],
  },
  {
    id: "sci-204",
    name: "Science Block 204",
    building: "Science Wing",
    capacity: 25,
    equipment: ["projector", "lab-bench"],
    blocked: true,
    blockReason: "HVAC maintenance until 6:00 PM",
    bookings: [
      { start: 600, end: 660, title: "Chem 201", bookedBy: "Prof. Reyes" },
    ],
  },
  {
    id: "lib-a",
    name: "Library Seminar Room A",
    building: "Main Library",
    capacity: 12,
    equipment: ["whiteboard", "tv-screen"],
    blocked: false,
    bookings: [
      { start: 600, end: 690, title: "Study Group", bookedBy: "J. Patel" },
      { start: 900, end: 960, title: "Book Club", bookedBy: "M. Chen" },
      { start: 1200, end: 1260, title: "Thesis Defense", bookedBy: "Dept. Chair" },
    ],
  },
  {
    id: "bus-110",
    name: "Business School 110",
    building: "Business Pavilion",
    capacity: 60,
    equipment: ["projector", "whiteboard", "audio-system", "video-conferencing"],
    blocked: false,
    bookings: [
      { start: 480, end: 570, title: "Macro Economics", bookedBy: "Prof. Saito" },
      { start: 1020, end: 1080, title: "Guest Lecture", bookedBy: "Dean's Office" },
    ],
  },
  {
    id: "art-3",
    name: "Arts Center Studio 3",
    building: "Arts Center",
    capacity: 20,
    equipment: ["audio-system", "studio-lighting"],
    blocked: false,
    bookings: [
      { start: 720, end: 810, title: "Sculpture Workshop", bookedBy: "Prof. Diaz" },
    ],
  },
  {
    id: "med-201",
    name: "Medical Building 201",
    building: "Health Sciences Wing",
    capacity: 35,
    equipment: ["projector", "whiteboard", "video-conferencing"],
    blocked: false,
    bookings: [
      { start: 540, end: 630, title: "Anatomy Review", bookedBy: "Dr. Okafor" },
      { start: 840, end: 900, title: "Clinical Case Study", bookedBy: "Dr. Okafor" },
    ],
  },
  {
    id: "law-105",
    name: "Law Building Moot Court 105",
    building: "Law Quad",
    capacity: 50,
    equipment: ["projector", "audio-system", "video-conferencing"],
    blocked: false,
    bookings: [
      { start: 660, end: 750, title: "Mock Trial", bookedBy: "Prof. Hartley" },
    ],
  },
  {
    id: "dsg-2",
    name: "Design Studio 2",
    building: "Creative Arts Building",
    capacity: 8,
    equipment: ["whiteboard", "tv-screen"],
    blocked: false,
    bookings: [
      { start: 900, end: 960, title: "UX Workshop", bookedBy: "Prof. Nguyen" },
      { start: 1140, end: 1200, title: "Portfolio Review", bookedBy: "Prof. Nguyen" },
    ],
  },
  {
    id: "gym-conf",
    name: "Sports Complex Conference Room",
    building: "Athletics Center",
    capacity: 15,
    equipment: ["tv-screen", "audio-system"],
    blocked: true,
    blockReason: "Floor refinishing until noon",
    bookings: [
      { start: 780, end: 840, title: "Coaches Meeting", bookedBy: "Coach Ramirez" },
    ],
  },
];

export const ALL_EQUIPMENT: string[] = [
  "projector",
  "whiteboard",
  "audio-system",
  "tv-screen",
  "video-conferencing",
  "lab-bench",
  "studio-lighting",
];

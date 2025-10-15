// Media URLs for todo attachments and other purposes
export const todoAttachmentImages = [
  // Documents and planning
  "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800", // laptop on desk
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800", // writing notes
  "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=800", // workspace
  "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800", // checklist

  // Business and meetings
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800", // team meeting
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800", // business people
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800", // office space
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", // team collaboration

  // Creative work
  "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800", // design work
  "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800", // color swatches
  "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800", // art supplies
  "https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?w=800", // drawing tablet

  // Coffee and breaks
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800", // coffee cup
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800", // coffee shop
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800", // coffee break

  // Technology
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800", // coding
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800", // laptop code
  "https://images.unsplash.com/photo-1488590088325-68d5e5e8e10f?w=800", // smartphone
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800", // tech devices

  // Travel and location
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800", // city view
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800", // airplane wing
  "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800", // road trip
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", // mountains

  // Health and fitness
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800", // yoga
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800", // gym
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800", // healthy food
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800", // food spread

  // Nature and outdoors
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", // forest path
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800", // nature scene
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800", // beach sunset
  "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800", // ocean waves
];

// Helper function to get random attachment images
export function getRandomAttachmentImages(count: number = 1): string[] {
  const shuffled = [...todoAttachmentImages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, todoAttachmentImages.length));
}

// Helper function to get a single random attachment image
export function getRandomAttachmentImage(): string {
  return todoAttachmentImages[
    Math.floor(Math.random() * todoAttachmentImages.length)
  ];
}

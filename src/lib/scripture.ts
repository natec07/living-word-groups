const DAILY_SCRIPTURES = [
  { text: "I sought the Lord, and he answered me and delivered me from all my fears.", ref: "Psalm 34:4" },
  { text: "Trust in the Lord with all your heart, and do not lean on your own understanding.", ref: "Proverbs 3:5" },
  { text: "I can do all things through him who strengthens me.", ref: "Philippians 4:13" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "Be strong and courageous. Do not fear or be in dread of them, for it is the Lord your God who goes with you.", ref: "Deuteronomy 31:6" },
  { text: "And we know that for those who love God all things work together for good.", ref: "Romans 8:28" },
  { text: "Come to me, all who labor and are heavy laden, and I will give you rest.", ref: "Matthew 11:28" },
  { text: "Wait for the Lord; be strong, and let your heart take courage; wait for the Lord!", ref: "Psalm 27:14" },
  { text: "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles.", ref: "Isaiah 40:31" },
  { text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.", ref: "Philippians 4:6" },
];

export function scriptureOfTheDay() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return DAILY_SCRIPTURES[dayOfYear % DAILY_SCRIPTURES.length];
}

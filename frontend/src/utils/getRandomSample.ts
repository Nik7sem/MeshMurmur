export function getRandomSample<T>(set: Set<T>, sampleSize: number): Array<T> {
  const array = Array.from(set); // Convert Set to Array
  const shuffled = array.sort(() => Math.random() - 0.5); // Shuffle the array
  return shuffled.slice(0, Math.min(sampleSize, set.size)); // Take `sampleSize` elements
}
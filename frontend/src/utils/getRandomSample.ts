export function getRandomSample<T>(iterable: Set<T> | Array<T>, sampleSize: number): Array<T> {
  const array = Array.from(iterable); // Convert Iterable to Array
  const shuffled = array.sort(() => Math.random() - 0.5); // Shuffle the array
  return shuffled.slice(0, Math.min(sampleSize, array.length)); // Take `sampleSize` elements
}


export function shuffle(array: Array<any>) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}
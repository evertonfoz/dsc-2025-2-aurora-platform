export function toSlug(input: string): string {
  return input
    .normalize('NFD') // decompose accents
      .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars except spaces and -
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/-+/g, '-') // collapse multiple -
    .replace(/^-|-$/g, ''); // remove leading/trailing -
}

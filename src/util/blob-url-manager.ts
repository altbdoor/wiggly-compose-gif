const urls = new Set<string>();

export function create(blob: Blob) {
  const url = URL.createObjectURL(blob);
  urls.add(url);
  return url;
}

export function revoke(url: string) {
  if (!urls.has(url)) {
    return;
  }

  URL.revokeObjectURL(url);
  urls.delete(url);
}

export function revokeAll() {
  for (const url of urls) {
    URL.revokeObjectURL(url);
  }

  urls.clear();
}

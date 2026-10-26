const LOCAL_HOSTNAME_PATTERN =
  /^(localhost|0\.0\.0\.0|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|\[::1\])$/i;

export function isLocalDevelopmentImageUrl(imageUrl: string): boolean {
  try {
    const url = new URL(imageUrl, 'https://portal.invalid');
    return /\/(?:src\/assets|assets\/images)\//i.test(url.pathname)
      || LOCAL_HOSTNAME_PATTERN.test(url.hostname);
  } catch {
    return true;
  }
}

export function withBase(inDemo: boolean, href: string) {
  const clean = href.startsWith('/') ? href : `/${href}`;
  return inDemo ? `/demo${clean}` : clean;
}

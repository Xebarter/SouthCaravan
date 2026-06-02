export function isAdminConsolePath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

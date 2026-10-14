export type AdminNavIconName = 'bar-chart' | 'home' | 'users' | 'credit-card' | 'settings' | 'message';

export interface AdminNavItem {
  label: string;
  route: string;
  icon: AdminNavIconName;
}

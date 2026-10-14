export type NavIcon =
  | 'grid' | 'list' | 'clock' | 'settings' | 'star'
  | 'credit-card' | 'users' | 'message' | 'bar-chart';

export interface NavItem {
  label: string;
  route: string;
  icon: NavIcon;
}

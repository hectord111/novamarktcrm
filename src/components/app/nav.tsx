import { LayoutDashboard, Users, KanbanSquare, Building2, Megaphone, ImagePlus, Zap, MessageCircle, Settings, type LucideIcon } from 'lucide-react';
import type { UserRole } from '@/lib/types';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  agencyOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/clients', label: 'Clientes', icon: Building2, agencyOnly: true },
  { href: '/campaigns', label: 'Campañas', icon: Megaphone },
  { href: '/ads', label: 'Anuncios', icon: ImagePlus, agencyOnly: true },
  { href: '/automations', label: 'Automatizaciones', icon: Zap },
  { href: '/messages', label: 'Mensajes', icon: MessageCircle },
  { href: '/settings', label: 'Ajustes', icon: Settings, agencyOnly: true },
];

export function navForRole(role: UserRole) {
  const agency = role === 'owner' || role === 'admin' || role === 'agent';
  return NAV_ITEMS.filter((i) => !i.agencyOnly || agency);
}

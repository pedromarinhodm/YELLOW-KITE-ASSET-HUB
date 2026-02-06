import { 
  LayoutDashboard, 
  Monitor, 
  Users, 
  ArrowRightLeft,
  Laptop
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Inventário', url: '/inventory', icon: Monitor },
  { title: 'Colaboradores', url: '/employees', icon: Users },
  { title: 'Alocações', url: '/allocations', icon: ArrowRightLeft },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className="border-r border-border" collapsible="icon">
      <SidebarHeader className="p-3 md:p-4 border-b border-border">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm flex-shrink-0">
            <Laptop className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-semibold text-foreground truncate">Yellow Kite</h1>
              <p className="text-xs text-muted-foreground truncate">Gestão de Equipamentos</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 md:px-3 py-3 md:py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 md:space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm"
                    >
                      <item.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                      <span className="font-medium text-sm md:text-base">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

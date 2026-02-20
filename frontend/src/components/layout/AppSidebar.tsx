import {
  LayoutDashboard,
  Monitor,
  Users,
  ArrowRightLeft,
  ClipboardList,
  LogOut,
  ShieldCheck,
  User,
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
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import logoPipa from '@/assets/logo-pipa.png';

export function AppSidebar() {
  const { profile, role, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sessao encerrada.');
  };

  const navItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Alocacoes', url: '/allocations', icon: ArrowRightLeft },
    { title: 'Inventario', url: '/inventory', icon: Monitor },
    { title: 'Colaboradores', url: '/employees', icon: Users },
    ...(isAdmin ? [{ title: 'Auditoria', url: '/audit', icon: ClipboardList }] : []),
  ];

  return (
    <Sidebar className="border-r border-border" collapsible="offcanvas">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img src={logoPipa} alt="Yellow Kite" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-base font-semibold text-foreground">Yellow Kite</h1>
            <p className="text-xs text-muted-foreground">Gestao de Equipamentos</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{profile?.name ?? '-'}</p>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground truncate">
                {role === 'admin' ? 'Administrador' : 'Coordenador'}
                {role === 'coordinator' && profile?.department ? ` - ${profile.department}` : ''}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

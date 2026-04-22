import { Flame } from "lucide-react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  Network as NetIcon,
  Activity,
  Zap,
  Compass,
  Shield,
  Globe,
  FileText,
  Rocket,
} from "lucide-react";

const explorerItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Blocks", url: "/blocks", icon: Boxes },
  { title: "Transactions", url: "/transactions", icon: ArrowLeftRight },
  { title: "Network", url: "/network", icon: NetIcon },
  { title: "Uptime", url: "/uptime", icon: Activity },
];

const chainItems = [
  { title: "Swap", url: "/swap", icon: ArrowLeftRight },
  { title: "Deploy Token", url: "/deploy", icon: Rocket },
  { title: "Terminal", url: "/terminal", icon: Zap },
  { title: "Ecosystem", url: "/ecosystem", icon: Compass },
  { title: "Parameters", url: "/parameters", icon: Shield },
];

const litvmItems = [
  { title: "LiteForge Explorer", url: "https://liteforge.explorer.caldera.xyz", icon: Globe, external: true },
  { title: "Docs", url: "https://docs.litvm.io", icon: FileText, external: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gradient-cyan text-primary-foreground shadow-glow-cyan">
            <Flame className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-lg text-gradient-cyan">LitVM Explorer</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">By LiteForge</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-[0.2em]">Explorer</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {explorerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <RouterNavLink to={item.url} end>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </RouterNavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-[0.2em]">Chain</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <RouterNavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </RouterNavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-[0.2em]">LitVM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {litvmItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="text-[10px] leading-relaxed text-muted-foreground">
            LitVM Ecosystem
            <br />© 2026 LiteForge · v1.0
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

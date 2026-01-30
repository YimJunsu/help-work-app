import { useState, useEffect } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarInset,
  SidebarFooter,
  SidebarSeparator,
} from "./ui/sidebar";
import {
  Headset,
  NotebookTabs,
  Sun,
  Moon,
  CalendarCheck,
  ListChecks,
  Settings,
} from "lucide-react";
import { Button } from "./ui/button";
import { Dashboard } from "../pages/Dashboard";
import { TodoList } from "../pages/TodoList";
import { UniSupport } from "../pages/UniSupport";
import { Settings as SettingsPage } from "../pages/Settings";
import { WorkBatteryIndicator } from "./WorkBatteryIndicator";
import uniFightingLogo from "@resources/uni_fighting.png";

type Page = "dashboard" | "todolist" | "schedule" | "unisupport" | "memo" | "setting";

export function Layout() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // 업데이트 감지
  useEffect(() => {
    const onUpdateAvailable = () => setHasUpdate(true);
    const onUpdateNotAvailable = () => setHasUpdate(false);

    window.electron.ipcRenderer.on("update-available", onUpdateAvailable);
    window.electron.ipcRenderer.on("update-not-available", onUpdateNotAvailable);

    return () => {
      window.electron.ipcRenderer.removeAllListeners("update-available");
      window.electron.ipcRenderer.removeAllListeners("update-not-available");
    };
  }, []);

  return (
    <SidebarProvider>
      {/* h-screen을 추가하여 뷰포트 높이에 고정합니다. */}
      <div
        className="flex h-screen w-full bg-background overflow-hidden"
        style={
          {
            "--sidebar-width": "12rem",
          } as React.CSSProperties
        }
      >
        <Sidebar
          variant="sidebar"
          className="border-r border-border after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border/40"
        >
          <SidebarHeader className="px-3 py-4">
            <button
              className="flex items-center gap-3 w-full rounded-md hover:bg-accent/50 transition-colors p-1 -m-1"
              onClick={() => setCurrentPage("dashboard")}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-transparent">
                <img
                  src={uniFightingLogo}
                  alt="Logo"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold leading-none">Help Work</p>
                <p className="text-xs text-muted-foreground">
                  당신의 업무 도우미
                </p>
              </div>
            </button>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={currentPage === "todolist"}
                    onClick={() => setCurrentPage("todolist")}
                  >
                    <ListChecks />
                    <span>Todo-List</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={currentPage === "schedule"}
                    onClick={() => setCurrentPage("schedule")}
                  >
                    <CalendarCheck />
                    <span>Duty Schedule</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={currentPage === "unisupport"}
                    onClick={() => setCurrentPage("unisupport")}
                  >
                    <Headset />
                    <span>UniSupport</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={currentPage === "memo"}
                    onClick={() => setCurrentPage("memo")}
                  >
                    <NotebookTabs />
                    <span>Memo</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="px-3 py-3 text-xs text-muted-foreground">
            <div className="relative group">
              <SidebarMenuButton
                isActive={currentPage === "setting"}
                onClick={() => setCurrentPage("setting")}
              >
                <div className="relative">
                  <Settings />
                  {hasUpdate && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                    </span>
                  )}
                </div>
                <span>Setting</span>
              </SidebarMenuButton>
              {hasUpdate && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  신규 업데이트가 있습니다!
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-red-500" />
                </div>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col h-full overflow-hidden">
          <header className="flex h-14 items-center border-b border-border/60 px-6 shrink-0">
            <h1 className="text-lg font-semibold">
              {currentPage === "dashboard" && "Dashboard"}
              {currentPage === "todolist" && "투두-리스트"}
              {currentPage === "schedule" && "나의 스케줄 확인"}
              {currentPage === "unisupport" && "UniSupport 요청 내역"}
              {currentPage === "memo" && "메모장"}
              {currentPage === "setting" && "설정"}
            </h1>

            <div className="ml-auto flex items-center gap-3">
              <WorkBatteryIndicator />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDark((d) => !d)}
              >
                {dark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </header>

          <main className="flex-1 flex flex-col overflow-hidden p-6">
            {currentPage === "dashboard" && <Dashboard />}
            {currentPage === "todolist" && <TodoList />}
            {currentPage === "unisupport" && <UniSupport />}
            {currentPage === "setting" && <SettingsPage />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

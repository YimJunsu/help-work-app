import { useState, useEffect, useCallback } from "react";
import {
  User,
  Download,
  Save,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  FolderOpen,
  ChevronDown,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { cn } from "../lib/utils";

type Tab = "user" | "update";

export function Settings() {
  const [tab, setTab] = useState<Tab>("user");

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white text-slate-900">
      {/* 상단 슬라이딩 탭 */}
      <div className="flex-shrink-0 px-8 pt-8 pb-6 flex justify-center">
        <div className="relative flex bg-slate-100 p-1 rounded-[14px] w-[320px]">
          <div
            className={cn(
              "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-[10px] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
              tab === "user" ? "translate-x-0" : "translate-x-full",
            )}
          />
          <button
            onClick={() => setTab("user")}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-bold transition-colors duration-300",
              tab === "user" ? "text-blue-600" : "text-slate-500",
            )}
          >
            <User className="w-4 h-4" />
            사용자 정보
          </button>
          <button
            onClick={() => setTab("update")}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-bold transition-colors duration-300",
              tab === "update" ? "text-blue-600" : "text-slate-500",
            )}
          >
            <Download className="w-4 h-4" />
            업데이트
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-8 pb-4">
        <div className="max-w-[580px] mx-auto h-full flex flex-col">
          {tab === "user" ? <UserInfoSection /> : <UpdateSection />}
        </div>
      </div>
    </div>
  );
}

function UserInfoSection() {
  const [name, setName] = useState("");
  const [supportId, setSupportId] = useState("");
  const [supportPw, setSupportPw] = useState("");
  const [supportPartType, setSupportPartType] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbPath, setDbPath] = useState("");

  const teams = ["1팀", "2팀", "3팀", "4팀"];

  const loadUserInfo = useCallback(async () => {
    try {
      if (!window.electron) return;
      const info = await window.electron.ipcRenderer.invoke("userInfo:get");
      if (info) {
        setName(info.name || "");
        setSupportId(info.supportId || "");
        setSupportPw(info.supportPw || "");
        setSupportPartType(info.supportPartType || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserInfo();
    window.electron?.ipcRenderer
      .invoke("get-db-path")
      .then((p: string) => {
        const normalized = p.replace(/\\/g, "/").split("/");
        normalized.pop();
        setDbPath(normalized.join("/") + "/datas");
      })
      .catch(() => {});
  }, [loadUserInfo]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await window.electron.ipcRenderer.invoke("userInfo:createOrUpdate", {
        name: name.trim(),
        birthday: "2000-01-01",
        supportId: supportId.trim(),
        supportPw,
        supportPartType,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
      </div>
    );

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-400 h-full">
      <div className="space-y-1.5">
        <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
          개인 프로필
        </h3>
        <div className="bg-slate-50/50 rounded-[18px] border border-slate-100 overflow-hidden">
          <SettingsRow label="이름">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="필수 입력"
              className="border-0 bg-transparent text-right focus-visible:ring-0 text-[13px] font-medium h-10"
            />
          </SettingsRow>
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
          UniPost 서포트 계정
        </h3>
        <div className="bg-slate-50/50 rounded-[18px] border border-slate-100 overflow-hidden">
          <SettingsRow label="아이디">
            <Input
              value={supportId}
              onChange={(e) => setSupportId(e.target.value)}
              placeholder="ID"
              className="border-0 bg-transparent text-right focus-visible:ring-0 text-[13px] font-medium h-10"
            />
          </SettingsRow>
          <SettingsRow label="비밀번호">
            <div className="flex items-center justify-end flex-1">
              <Input
                type={showPw ? "text" : "password"}
                value={supportPw}
                onChange={(e) => setSupportPw(e.target.value)}
                placeholder="Password"
                className="border-0 bg-transparent text-right focus-visible:ring-0 text-[13px] font-medium h-10 flex-1"
              />
              <button
                onClick={() => setShowPw(!showPw)}
                className="ml-2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </SettingsRow>
          <SettingsRow label="소속 팀">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-[13px] font-bold text-slate-700 hover:text-blue-600 transition-colors outline-none">
                  {supportPartType || "팀 선택"}
                  <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-32 rounded-[14px] shadow-xl border-slate-100 p-1"
              >
                {teams.map((team) => (
                  <DropdownMenuItem
                    key={team}
                    onClick={() => setSupportPartType(`구독 ${team}`)}
                    className="text-[12px] font-bold rounded-[8px] cursor-pointer focus:bg-blue-50 focus:text-blue-600"
                  >
                    구독 {team}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SettingsRow>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className={cn(
          "h-12 rounded-[18px] font-bold text-[14px] transition-all duration-300 mt-2",
          saved
            ? "bg-emerald-500 hover:bg-emerald-600"
            : "bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200",
        )}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : saved ? (
          <CheckCircle2 className="w-4 h-4 mr-2" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {saved ? "변경사항 저장됨" : "저장하기"}
      </Button>

      <div className="mt-auto mb-4 p-4 rounded-[18px] bg-blue-50/50 border border-blue-100 flex gap-3">
        <Shield className="w-5 h-5 text-blue-500 shrink-0" />
        <div className="space-y-1 overflow-hidden">
          <p className="text-[11px] font-medium text-blue-700/70 leading-relaxed">
            데이터는 로컬 PC에만 안전하게 암호화되어 저장됩니다.
          </p>
          {dbPath && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-blue-400">
              <FolderOpen className="w-3 h-3 shrink-0" />
              <span className="truncate">{dbPath}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-0.5 min-h-[48px] border-b border-slate-100/50 last:border-0">
      <span className="text-[13px] font-semibold text-slate-500 shrink-0">
        {label}
      </span>
      <div className="flex-1 flex justify-end items-center">{children}</div>
    </div>
  );
}

function UpdateSection() {
  const [currentVersion, setCurrentVersion] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    window.electron?.ipcRenderer
      .invoke("get-app-version")
      .then((v) => setCurrentVersion(v))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-bottom-2 duration-400">
      <div className="w-20 h-20 bg-slate-50 rounded-[28px] border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
        <div className="w-12 h-12 bg-blue-500 rounded-[18px] flex items-center justify-center text-white shadow-inner">
          <RefreshCw className={cn("w-6 h-6", checking && "animate-spin")} />
        </div>
      </div>
      <h2 className="text-xl font-black text-slate-900">소프트웨어 업데이트</h2>
      <p className="text-slate-400 text-[13px] font-medium mt-1 mb-8">
        현재 버전: v{currentVersion}
      </p>

      <div className="w-full bg-slate-50 rounded-[24px] p-6 border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h4 className="font-bold text-[14px]">자동 업데이트</h4>
            <p className="text-[11px] text-slate-400">
              최신 기능을 자동으로 유지합니다.
            </p>
          </div>
          <div className="w-10 h-6 bg-emerald-500 rounded-full flex items-center px-1">
            <div className="w-4 h-4 bg-white rounded-full shadow-sm ml-auto" />
          </div>
        </div>
        <Button
          onClick={() => setChecking(true)}
          disabled={checking}
          className="w-full h-12 rounded-[16px] bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm font-bold transition-all mt-2"
        >
          {checking ? "업데이트 확인 중..." : "지금 업데이트 확인"}
        </Button>
      </div>
      <p className="text-[11px] text-slate-300 mt-6 font-medium">
        최신 버전 확인 시 인터넷 연결이 필요합니다.
      </p>
    </div>
  );
}

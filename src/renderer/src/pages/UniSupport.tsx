import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Loader2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface UniPostRequest {
  id: string;
  title: string;
  status: string;
  submissionDate: string;
  requestType?: string;
  requestor?: string;
  handler?: string;
  detailUrl?: string;
}

let cachedRequests: UniPostRequest[] = [];
let cachedError: string | null = null;
let isCacheInitialized = false;

export function UniSupport() {
  const [requests, setRequests] = useState<UniPostRequest[]>(cachedRequests);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(cachedError);

  useEffect(() => {
    if (!isCacheInitialized) initializeData();
  }, []);

  const initializeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!window.electron) throw new Error("Electron API not available");
      const userInfo = await window.electron.ipcRenderer.invoke("userInfo:get");
      if (!userInfo?.name) {
        const msg =
          "⚠️ 사용자 정보가 없습니다.\n\n설정 → 사용자 정보에서 이름과 UniPost 계정 정보를 입력해주세요.";
        setError(msg);
        cachedError = msg;
        setIsLoading(false);
        return;
      }

      const loginResult = await window.electron.ipcRenderer.invoke(
        "unipost:loginWithStored",
      );
      if (loginResult.success) {
        await fetchRequestsInternal(userInfo.name);
        isCacheInitialized = true;
      } else {
        let errorMessage = loginResult.error || "로그인에 실패했습니다.";
        // ... (기존 에러 처리 로직 유지)
        setError(errorMessage);
        cachedError = errorMessage;
      }
    } catch (err: any) {
      const msg = err.message || "초기화 중 오류가 발생했습니다.";
      setError(msg);
      cachedError = msg;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequestsInternal = async (name: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        "unipost:fetchRequests",
        name,
      );
      if (result.success) {
        const data = result.data || [];
        setRequests(data);
        cachedRequests = data;
        if (data.length === 0) {
          const msg = "진행 중인 요청이 없습니다.";
          setError(msg);
          cachedError = msg;
        } else cachedError = null;
      } else {
        const msg = result.error || "요청 내역을 가져오는데 실패했습니다.";
        setError(msg);
        cachedError = msg;
      }
    } catch (err: any) {
      const msg = err.message || "요청 내역을 가져오는 중 오류가 발생했습니다.";
      setError(msg);
      cachedError = msg;
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    cachedError = null;
    try {
      if (!window.electron) throw new Error("Electron API not available");
      const userInfo = await window.electron.ipcRenderer.invoke("userInfo:get");
      if (!userInfo?.name) {
        setError("⚠️ 사용자 정보가 없습니다.");
        setIsLoading(false);
        return;
      }
      await fetchRequestsInternal(userInfo.name);
    } catch (err: any) {
      setError(err.message || "새로고침 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status.includes("진행") || status.includes("Progress"))
      return "default";
    if (status.includes("완료") || status.includes("Complete"))
      return "secondary";
    if (status.includes("대기") || status.includes("Pending")) return "outline";
    return "default";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    // 1. px-1로 좌우 여백 축소, overflow-hidden으로 창 스크롤 방지
    <div className="w-full h-full flex flex-col px-1 py-4 overflow-hidden">
      {/* 2. 카드 높이를 100%로 고정 */}
      <Card className="flex flex-col h-full border shadow-sm overflow-hidden bg-card">
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* 상단 헤더/상태바 영역 (고정) */}
          <div className="p-3 border-b bg-card flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  진행중
                </h2>
                {requests.length > 0 && (
                  <Badge variant="outline" className="text-[10px] py-0 h-5">
                    총 {requests.length}건
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                )}
                <Button
                  onClick={handleRefresh}
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* 에러 발생 시 노출 */}
            {error && !isLoading && (
              <div className="mt-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5" />
                <p className="text-[11px] font-medium text-destructive whitespace-pre-line">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* 3. 테이블 영역 (카드 내부 스크롤) */}
          <div className="flex-1 overflow-y-auto overflow-x-auto relative scrollbar-thin scrollbar-thumb-rounded">
            {!isLoading && requests.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <ExternalLink className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-sm font-semibold text-muted-foreground">
                  내역을 찾을 수 없습니다.
                </h3>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-border text-[11px]">
                <thead className="bg-muted/50 sticky top-0 z-20 backdrop-blur-md">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                      접수번호
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider w-[90px]">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider w-[80px]">
                      처리자
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                      접수일
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider w-[120px]">
                      고객사
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border/50">
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-accent/40 transition-colors group"
                    >
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => {
                            const url = `https://114.unipost.co.kr/home.uni?access=list&srIdx=${req.id}`;
                            window.electron?.ipcRenderer.send(
                              "open-external",
                              url,
                            );
                          }}
                          className="font-mono text-primary font-bold hover:underline"
                        >
                          {req.id}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => {
                            if (req.id && window.electron) {
                              const url = `https://114.unipost.co.kr/home.uni?access=list&srIdx=${req.id}`;
                              window.electron.ipcRenderer.send(
                                "open-external",
                                url,
                              );
                            }
                          }}
                          className="text-left font-medium hover:text-primary hover:underline transition-colors line-clamp-1"
                        >
                          {req.title}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={getStatusBadgeVariant(req.status)}
                          className="text-[10px] px-2 py-0.5 whitespace-nowrap inline-flex justify-center min-w-[70px]"
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {req.handler || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {formatDate(req.submissionDate)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[120px]">
                        {req.requestType || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * =========================
 * UniSupport.tsx
 * UniPost(유니포스트) 고객지원 요청 현황 컴포넌트
 * =========================
 */

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

/**
 * =========================
 * UniPost 요청 데이터 타입
 * =========================
 */
interface UniPostRequest {
  id: string; // 접수번호
  title: string; // 요청 제목
  status: string; // 처리 상태
  submissionDate: string; // 접수일
  requestType?: string; // 고객사 / 요청 유형
  requestor?: string; // 요청자
  handler?: string; // 처리자
  detailUrl?: string; // 상세 페이지 URL
}

/**
 * =========================
 * 전역 캐시 (페이지 이동 시 재사용)
 * =========================
 */
let cachedRequests: UniPostRequest[] = []; // 마지막으로 불러온 요청 목록
let cachedError: string | null = null; // 마지막 에러 메시지
let isCacheInitialized = false; // 캐시 초기화 여부

/**
 * =========================
 * 앱 시작 시 호출되는 프리패치 함수
 * - 로그인 & 요청 목록 미리 로드
 * - 실패해도 조용히 무시 (화면 진입 시 재시도)
 * =========================
 */
export async function prefetchUniSupportData(): Promise<void> {
  if (isCacheInitialized) return;

  try {
    if (!window.electron) return;

    // 사용자 정보 조회
    const userInfo = await window.electron.ipcRenderer.invoke("userInfo:get");
    if (!userInfo?.name) return;

    // 저장된 계정으로 UniPost 로그인
    const loginResult = await window.electron.ipcRenderer.invoke(
      "unipost:loginWithStored",
    );
    if (!loginResult.success) return;

    // 요청 목록 조회
    const result = await window.electron.ipcRenderer.invoke(
      "unipost:fetchRequests",
      userInfo.name,
    );

    if (result.success) {
      cachedRequests = result.data || [];
      cachedError =
        cachedRequests.length === 0 ? "진행 중인 요청이 없습니다." : null;
      isCacheInitialized = true;
    }
  } catch {
    // 프리패치 실패는 무시 (UX 영향 없음)
  }
}

/** Dashboard에서 캐시된 UniSupport 데이터 접근 */
export function getCachedUniSupportData() {
  return { requests: cachedRequests, isInitialized: isCacheInitialized };
}

/**
 * =========================
 * UniSupport 메인 컴포넌트
 * =========================
 */
export function UniSupport() {
  /**
   * -------------------------
   * 상태 관리
   * -------------------------
   */
  const [requests, setRequests] = useState<UniPostRequest[]>(cachedRequests);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(cachedError);

  /**
   * -------------------------
   * 최초 진입 시 데이터 초기화
   * -------------------------
   */
  useEffect(() => {
    if (!isCacheInitialized) initializeData();
  }, []);

  /**
   * =========================
   * 초기화 로직
   * - 사용자 정보 확인
   * - 로그인
   * - 요청 목록 조회
   * =========================
   */
  const initializeData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!window.electron) throw new Error("Electron API not available");

      // 사용자 정보 확인
      const userInfo = await window.electron.ipcRenderer.invoke("userInfo:get");
      if (!userInfo?.name) {
        const msg =
          "⚠️ 사용자 정보가 없습니다.\n\n설정 → 사용자 정보에서 이름과 UniPost 계정 정보를 입력해주세요.";
        setError(msg);
        cachedError = msg;
        return;
      }

      // UniPost 로그인
      const loginResult = await window.electron.ipcRenderer.invoke(
        "unipost:loginWithStored",
      );

      if (loginResult.success) {
        // 로그인 성공 → 요청 목록 조회
        await fetchRequestsInternal(userInfo.name);
        isCacheInitialized = true;
      } else {
        // 로그인 실패
        const errorMessage = loginResult.error || "로그인에 실패했습니다.";
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

  /**
   * =========================
   * 요청 목록 조회 (내부 공용 함수)
   * =========================
   */
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

        // 데이터는 있지만 비어있는 경우
        if (data.length === 0) {
          const msg = "진행 중인 요청이 없습니다.";
          setError(msg);
          cachedError = msg;
        } else {
          cachedError = null;
        }
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

  /**
   * =========================
   * 새로고침 버튼 핸들러
   * =========================
   */
  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    cachedError = null;

    try {
      if (!window.electron) throw new Error("Electron API not available");

      const userInfo = await window.electron.ipcRenderer.invoke("userInfo:get");
      if (!userInfo?.name) {
        setError("⚠️ 사용자 정보가 없습니다.");
        return;
      }

      await fetchRequestsInternal(userInfo.name);
    } catch (err: any) {
      setError(err.message || "새로고침 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * =========================
   * 상태값에 따른 Badge 스타일
   * =========================
   */
  const getStatusBadgeVariant = (status: string) => {
    if (status.includes("진행") || status.includes("Progress"))
      return "default";
    if (status.includes("완료") || status.includes("Complete"))
      return "secondary";
    if (status.includes("대기") || status.includes("Pending")) return "outline";
    return "default";
  };

  /**
   * =========================
   * 날짜 포맷 (YYYY.MM.DD)
   * =========================
   */
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

  /**
   * =========================
   * 렌더링
   * =========================
   */
  return (
    // 전체 컨테이너 (스크롤은 카드 내부에서만)
    <div className="w-full h-full flex flex-col px-1 py-4 overflow-hidden">
      <Card className="flex flex-col h-full border shadow-sm overflow-hidden bg-card">
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* ===== 상단 헤더 영역 ===== */}
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

              {/* 로딩 & 새로고침 */}
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

            {/* 에러 메시지 */}
            {error && !isLoading && (
              <div className="mt-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5" />
                <p className="text-[11px] font-medium text-destructive whitespace-pre-line">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* ===== 테이블 영역 (스크롤) ===== */}
          <div className="flex-1 overflow-y-auto overflow-x-auto relative">
            {!isLoading && requests.length === 0 ? (
              // 데이터 없음 상태
              <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <ExternalLink className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-sm font-semibold text-muted-foreground">
                  내역을 찾을 수 없습니다.
                </h3>
              </div>
            ) : (
              // 요청 목록 테이블
              <table className="min-w-full divide-y divide-border text-[11px]">
                <thead className="bg-muted/50 sticky top-0 z-20">
                  <tr>
                    <th className="px-4 py-3 w-[100px]">접수번호</th>
                    <th className="px-4 py-3">제목</th>
                    <th className="px-4 py-3 w-[90px]">상태</th>
                    <th className="px-4 py-3 w-[80px]">처리자</th>
                    <th className="px-4 py-3 w-[100px]">접수일</th>
                    <th className="px-4 py-3 w-[120px]">고객사</th>
                  </tr>
                </thead>

                <tbody className="bg-card divide-y divide-border/50">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-accent/40">
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() =>
                            window.electron?.ipcRenderer.send(
                              "open-external",
                              `https://114.unipost.co.kr/home.uni?access=list&srIdx=${req.id}`,
                            )
                          }
                          className="font-mono text-primary font-bold hover:underline"
                        >
                          {req.id}
                        </button>
                      </td>

                      <td className="px-4 py-2.5">
                        <button
                          onClick={() =>
                            window.electron?.ipcRenderer.send(
                              "open-external",
                              `https://114.unipost.co.kr/home.uni?access=list&srIdx=${req.id}`,
                            )
                          }
                          className="text-left font-medium line-clamp-1 hover:underline"
                        >
                          {req.title}
                        </button>
                      </td>

                      <td className="px-4 py-2.5">
                        <Badge
                          variant={getStatusBadgeVariant(req.status)}
                          className="text-[10px] min-w-[70px]"
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

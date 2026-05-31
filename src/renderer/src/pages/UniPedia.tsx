import { useState, useEffect, useRef, useCallback } from "react";
import {
  BookOpenText,
  Send,
  RefreshCw,
  User,
  Sparkles,
  WifiOff,
  SearchX,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { cn } from "../lib/utils";

type MessageType = "normal" | "error" | "no-result";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: MessageType;
}

// 검색 결과 타입 (devDocs/UNIPEDIA_API_DESIGN.md 스키마 기준)
interface SearchResult {
  id: string;
  title: string;
  part_type: "SAP" | "WEB";
  solution: string;
  tags?: string[];
  severity?: string;
  score: number;
}

interface ApiResponse {
  success: boolean;
  data?: { results: SearchResult[]; total: number };
  error?: "CONNECTION_FAILED" | "UNKNOWN";
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: `안녕하세요! 저는 유니백과 어시스턴트입니다.\n\n오류 내용을 입력하면 관련 해결 방법을 찾아드립니다.\n예) "SAP 로그인 후 권한 오류", "웹 화면이 빈 화면으로 표시"`,
  timestamp: new Date(),
  type: "normal",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 메시지 타입별 아이콘 */
function AssistantIcon({ type }: { type?: MessageType }) {
  if (type === "error") return <WifiOff className="w-3.5 h-3.5 text-destructive" />;
  if (type === "no-result") return <SearchX className="w-3.5 h-3.5 text-muted-foreground" />;
  return <Sparkles className="w-3.5 h-3.5 text-primary" />;
}

export function UniPedia() {
  const [messages, setMessages] = useState<Message[]>([
    { ...WELCOME_MESSAGE, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
      type: "normal",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantMsg: Message;

    try {
      // 백엔드 IPC 호출 — devDocs/UNIPEDIA_API_DESIGN.md 참고
      const response: ApiResponse = await window.electron.ipcRenderer.invoke(
        "unipedia:search",
        trimmed,
      );

      if (!response.success || response.error === "CONNECTION_FAILED") {
        assistantMsg = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            "서버에 연결할 수 없습니다.\n유니백과 서버 상태를 확인하거나 관리자에게 문의해 주세요.",
          timestamp: new Date(),
          type: "error",
        };
      } else if (!response.data || response.data.results.length === 0) {
        assistantMsg = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `"${trimmed}"에 해당하는 오류 사례를 찾지 못했습니다.\n\n다른 키워드로 다시 시도해 보세요.\n예) 오류 코드, 화면명, 증상을 구체적으로 입력`,
          timestamp: new Date(),
          type: "no-result",
        };
      } else {
        const items = response.data.results;
        const lines = items.map((r, i) => {
          const badge = r.part_type === "SAP" ? "[SAP]" : "[WEB]";
          const score = Math.round(r.score * 100);
          const tagLine = r.tags?.length ? `\n태그: ${r.tags.join(", ")}` : "";
          return `${i + 1}. ${badge} ${r.title} (유사도 ${score}%)\n\n${r.solution}${tagLine}`;
        });
        assistantMsg = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `총 ${items.length}건의 관련 사례를 찾았습니다.\n\n${lines.join("\n\n──────────\n\n")}`,
          timestamp: new Date(),
          type: "normal",
        };
      }
    } catch {
      assistantMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content:
          "서버에 연결할 수 없습니다.\n유니백과 서버 상태를 확인하거나 관리자에게 문의해 주세요.",
        timestamp: new Date(),
        type: "error",
      };
    }

    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  }, [input, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }]);
    setInput("");
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* ── 상단 헤더 ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 pt-2 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpenText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold leading-none">유니백과</h2>
            <p className="text-[10px] text-muted-foreground mt-1">
              업무 오류 지식 어시스턴트
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleReset}
          title="대화 초기화"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── 채팅 메시지 영역 ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-5 scrollbar-thin scrollbar-stable">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2.5",
              msg.role === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            {/* 아바타 */}
            <div
              className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5",
                msg.role === "assistant"
                  ? msg.type === "error"
                    ? "bg-destructive/10"
                    : msg.type === "no-result"
                      ? "bg-muted"
                      : "bg-primary/10"
                  : "bg-muted",
              )}
            >
              {msg.role === "assistant" ? (
                <AssistantIcon type={msg.type} />
              ) : (
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>

            {/* 버블 + 타임스탬프 */}
            <div
              className={cn(
                "flex flex-col gap-1 max-w-[76%]",
                msg.role === "user" ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "px-3.5 py-2.5 text-[12.5px] leading-relaxed whitespace-pre-wrap break-words shadow-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-[4px]"
                    : msg.type === "error"
                      ? "bg-destructive/8 text-destructive border border-destructive/20 rounded-2xl rounded-tl-[4px]"
                      : msg.type === "no-result"
                        ? "bg-muted/50 text-muted-foreground border border-border/30 rounded-2xl rounded-tl-[4px]"
                        : "bg-muted/60 text-foreground border border-border/30 rounded-2xl rounded-tl-[4px]",
                )}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-muted-foreground/50 px-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {/* 타이핑 인디케이터 */}
        {isLoading && (
          <div className="flex gap-2.5 flex-row">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="px-3.5 py-3 bg-muted/60 rounded-2xl rounded-tl-[4px] border border-border/30 flex items-center gap-1.5 shadow-sm">
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── 입력창 ── */}
      <div className="flex-shrink-0 px-6 pb-4 pt-3 border-t border-border/40">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="오류 내용을 입력하세요... (Shift+Enter 줄바꿈)"
            className="flex-1 resize-none text-[12.5px] rounded-xl border-border/50 bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary/30 py-3 px-3.5 scrollbar-thin leading-relaxed"
            style={{ minHeight: "44px", maxHeight: "120px" }}
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 flex-shrink-0 transition-all disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/35 mt-2 text-center">
          Enter로 전송 &middot; Shift+Enter로 줄바꿈
        </p>
      </div>
    </div>
  );
}

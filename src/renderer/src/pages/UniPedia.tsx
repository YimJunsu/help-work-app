import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import {
  BookOpenText,
  Send,
  RefreshCw,
  User,
  Sparkles,
  WifiOff,
  SearchX,
  HelpCircle,
  PlusCircle,
  Search,
  MessageSquare,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";

type MessageType = "normal" | "error" | "no-result";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: MessageType;
  source?: "internal" | "external";
  similarity?: number | null;
}

interface ChatResponseData {
  source: "internal" | "external";
  similarity: number | null;
  answer: string;
}

interface ApiResponse {
  success: boolean;
  data?: ChatResponseData;
  error?: "CONNECTION_FAILED" | "RATE_LIMITED" | "SERVICE_UNAVAILABLE" | "SERVER_ERROR" | "UNKNOWN";
  message?: string;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: `안녕하세요! 저는 유니백과 어시스턴트입니다.\n\n오류 내용을 입력하면 관련 해결 방법을 찾아드립니다.\n예) "401 오류 해결해줘", "라이센스 머시기 뜨는데?"`,
  timestamp: new Date(),
  type: "normal",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function AssistantIcon({ type }: { type?: MessageType }) {
  if (type === "error")     return <WifiOff className="w-3.5 h-3.5 text-destructive" />;
  if (type === "no-result") return <SearchX className="w-3.5 h-3.5 text-muted-foreground" />;
  return <Sparkles className="w-3.5 h-3.5 text-primary" />;
}

function SourceBadge({ source, similarity }: { source?: "internal" | "external"; similarity?: number | null }) {
  if (!source) return null;
  return (
    <div className="flex items-center gap-1.5 px-1">
      <span
        className={cn(
          "text-[9.5px] px-1.5 py-0.5 rounded-full border",
          source === "internal"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-violet-500/10 text-violet-400 border-violet-500/20",
        )}
      >
        {source === "internal" ? "사내 지식" : "AI 생성"}
      </span>
      {similarity !== null && similarity !== undefined && (
        <span className="text-[9.5px] text-muted-foreground/50">
          {Math.round(similarity * 100)}% 유사
        </span>
      )}
    </div>
  );
}

export function UniPedia() {
  const [messages, setMessages] = useState<Message[]>([
    { ...WELCOME_MESSAGE, timestamp: new Date() },
  ]);
  const [input, setInput]       = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [helpOpen, setHelpOpen]   = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
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
      const response: ApiResponse = await window.electron.ipcRenderer.invoke(
        "unipedia:chat",
        trimmed,
      );

      if (!response.success) {
        let errorContent = "서버에 연결할 수 없습니다.\n유니백과 서버 상태를 확인하거나 관리자에게 문의해 주세요.";

        if (response.error === "RATE_LIMITED") {
          errorContent = "AI 요청 한도를 초과했습니다.\n잠시 후 (약 1분) 다시 시도해 주세요.";
        } else if (response.error === "SERVICE_UNAVAILABLE") {
          errorContent = "AI 서비스가 일시적으로 혼잡합니다.\n잠시 후 다시 시도해 주세요.";
        }

        assistantMsg = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: errorContent,
          timestamp: new Date(),
          type: "error",
        };
      } else if (!response.data) {
        assistantMsg = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `"${trimmed}"에 해당하는 사례를 찾지 못했습니다.\n다른 키워드로 다시 시도해 보세요.`,
          timestamp: new Date(),
          type: "no-result",
        };
      } else {
        const { source, similarity, answer } = response.data;

        // DB에 임베딩 데이터가 없는 경우 (similarity === null)
        const type: MessageType = similarity === null ? "no-result" : "normal";
        const content = similarity === null
          ? `등록된 사례가 없어 AI가 답변합니다.\n\n${answer}`
          : answer;

        assistantMsg = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content,
          timestamp: new Date(),
          type,
          source,
          similarity,
        };
      }
    } catch {
      assistantMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "서버에 연결할 수 없습니다.\n유니백과 서버 상태를 확인하거나 관리자에게 문의해 주세요.",
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
      void handleSend();
    }
  };

  const handleReset = () => {
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }]);
    setInput("");
    textareaRef.current?.focus();
  };

  return (
    <>
      {/* 사용 방법 다이어로그 */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[14px]">
              <HelpCircle className="h-4 w-4 text-primary" />
              유니백과 사용 방법
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <HelpItem
              icon={<Search className="h-3.5 w-3.5 text-primary" />}
              title="오류 검색"
              desc={`오류 코드, 화면명, 증상을 입력하면\n관련 해결 사례를 찾을 수 있어요.`}
            />
            <HelpItem
              icon={<MessageSquare className="h-3.5 w-3.5 text-primary" />}
              title="입력 예시"
              desc={`"401 오류 해결해줘"\n"라이센스 오류가 떠요"\n"로그인 후 화면이 안 넘어가요"`}
            />
            <HelpItem
              icon={<AlertCircle className="h-3.5 w-3.5 text-primary" />}
              title="오류 내역 추가"
              desc={`검색되지 않는 오류가 있나요?\n+ 버튼으로 새 사례를 등록할 수 있어요.\n함께 지식을 공유할 수 있어요.`}
            />
            <HelpItem
              icon={<Info className="h-3.5 w-3.5 text-primary" />}
              title="AI 대화 안내"
              desc={`AI는 이전 질문과 답변을 기억하지 않아요.\n대화 내용은 저장되지 않으며 초기화 시 삭제돼요.`}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* ── 상단 헤더 ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-2 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpenText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold leading-none">유니백과</h2>
              <p className="text-[10px] text-muted-foreground mt-1">업무 오류 지식 어시스턴트</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setHelpOpen(true)}
              title="사용 방법"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleReset}
              title="대화 초기화"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              onClick={() =>
                window.electron?.ipcRenderer.send(
                  "open-external",
                  "http://192.168.10.122:5176/unipedia/register",
                )
              }
              title="오류 내역 추가"
            >
              <PlusCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
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
                    ? msg.type === "error"     ? "bg-destructive/10"
                    : msg.type === "no-result" ? "bg-muted"
                    : "bg-primary/10"
                    : "bg-muted",
                )}
              >
                {msg.role === "assistant"
                  ? <AssistantIcon type={msg.type} />
                  : <User className="w-3.5 h-3.5 text-muted-foreground" />
                }
              </div>

              {/* 버블 + 타임스탬프 + 뱃지 */}
              <div
                className={cn(
                  "flex flex-col gap-1 max-w-[76%]",
                  msg.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "px-3.5 py-2.5 text-[12.5px] break-words shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-[4px] whitespace-pre-wrap leading-relaxed"
                      : msg.type === "error"
                        ? "bg-destructive/8 text-destructive border border-destructive/20 rounded-2xl rounded-tl-[4px] whitespace-pre-wrap leading-relaxed"
                        : msg.type === "no-result"
                          ? "bg-muted/50 text-muted-foreground border border-border/30 rounded-2xl rounded-tl-[4px]"
                          : "bg-muted/60 text-foreground border border-border/30 rounded-2xl rounded-tl-[4px]",
                  )}
                >
                  {msg.role === "user" || msg.type === "error"
                    ? msg.content
                    : <MarkdownText text={msg.content} />
                  }
                  {/* AI 단발성 안내 (에러 제외한 어시스턴트 메시지) */}
                  {msg.role === "assistant" && msg.type !== "error" && (
                    <p className="mt-2.5 pt-2 border-t border-border/20 text-[10.5px] text-muted-foreground/50 leading-relaxed">
                      {AI_FOOTER_NOTE}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground/50 px-1">
                    {formatTime(msg.timestamp)}
                  </span>
                  {msg.role === "assistant" && (
                    <SourceBadge source={msg.source} similarity={msg.similarity} />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 타이핑 인디케이터 */}
          {isLoading && (
            <div className="flex gap-2.5 flex-row">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="px-3.5 py-3 bg-muted/60 rounded-2xl rounded-tl-[4px] border border-border/30 flex items-center gap-2.5 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[11.5px] text-muted-foreground/60">AI가 답변을 준비하고 있어요, 잠시만 기다려 주세요.</span>
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
              onClick={() => void handleSend()}
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
    </>
  );
}

// ─── 마크다운 렌더러 ──────────────────────────────────────────

const AI_FOOTER_NOTE = "※ AI는 이전 질문과 답변을 기억하지 않아요. 대화 내용은 초기화 시 삭제됩니다.";

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/)
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        }
        if (/^\*[^*]+\*$/.test(part)) {
          return <em key={i}>{part.slice(1, -1)}</em>
        }
        if (/^`[^`]+`$/.test(part)) {
          return <code key={i} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">{part.slice(1, -1)}</code>
        }
        return part || null
      })}
    </>
  )
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n")
  const nodes: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }

    if (/^[-*_]{3,}$/.test(line.trim())) {
      nodes.push(<hr key={key++} className="border-border/30 my-1.5" />)
      i++; continue
    }

    const hMatch = line.match(/^(#{1,4})\s+(.+)$/)
    if (hMatch) {
      const cls = hMatch[1].length <= 2 ? "font-bold leading-snug mt-0.5" : "font-semibold leading-snug"
      nodes.push(<p key={key++} className={cls}>{renderInline(hMatch[2])}</p>)
      i++; continue
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""))
        i++
      }
      nodes.push(
        <ul key={key++} className="list-disc pl-4 space-y-0.5">
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ul>
      )
      continue
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""))
        i++
      }
      nodes.push(
        <ol key={key++} className="list-decimal pl-4 space-y-0.5">
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ol>
      )
      continue
    }

    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,4}\s+/.test(lines[i]) &&
      !/^[-*_]{3,}$/.test(lines[i].trim()) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      nodes.push(
        <p key={key++} className="leading-relaxed">
          {paraLines.map((pLine, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {renderInline(pLine)}
            </Fragment>
          ))}
        </p>
      )
    }
  }

  return <div className="space-y-2">{nodes}</div>
}

// ─── 내부 컴포넌트 ────────────────────────────────────────────

function HelpItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[12.5px] font-medium leading-none mb-1">{title}</p>
        <p className="text-[11.5px] text-muted-foreground leading-relaxed whitespace-pre-line">{desc}</p>
      </div>
    </div>
  );
}

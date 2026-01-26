/**
 * Button Component
 *
 * 재사용 가능한 버튼 컴포넌트 - iOS 스타일 인터랙션 적용
 * - 6가지 variant (default, destructive, outline, secondary, ghost, link)
 * - 4가지 size (sm, default, lg, icon)
 * - 접근성 강화 (포커스 링, 키보드 네비게이션)
 * - 부드러운 애니메이션 (hover, active)
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  // 기본 스타일
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium " +
  // 포커스 링 (접근성)
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  // Disabled 상태
  "disabled:pointer-events-none disabled:opacity-50 " +
  // 아이콘 스타일
  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 " +
  // iOS 스타일 애니메이션
  "transition-all duration-150 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary 액션 - 주요 버튼
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",

        // 경고/삭제 액션
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",

        // 보조 액션 - 테두리만
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50",

        // Secondary 액션
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",

        // 최소 스타일 - 미묘한 액션
        ghost: "hover:bg-accent hover:text-accent-foreground",

        // 링크 스타일
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

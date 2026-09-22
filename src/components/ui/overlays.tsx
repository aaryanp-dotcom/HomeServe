'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react'

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, description, children, size = 'md', footer }: ModalProps) {
  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size]

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const panel = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 isolate bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative bg-white shadow-2xl w-full max-h-[90vh]',
          'flex flex-col border border-stone-200 ',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          sizeClass
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-stone-100 ">
            <div>
              <h3 className="text-lg font-semibold text-stone-900 leading-snug">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-stone-500 mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 flex-shrink-0 text-stone-400 hover:text-stone-600 transition-colors p-1.5 hover:bg-stone-100 "
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(panel, document.body)
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
  duration?: number
}

const toastConfig: Record<ToastType, { bg: string; icon: typeof CheckCircle2; iconClass: string }> = {
  success: {
    bg: 'bg-white border border-sage-200 ',
    icon: CheckCircle2,
    iconClass: 'text-sage-500',
  },
  error: {
    bg: 'bg-white border border-rose-200 ',
    icon: XCircle,
    iconClass: 'text-rose-700',
  },
  info: {
    bg: 'bg-white border border-stone-200 ',
    icon: Info,
    iconClass: 'text-cobalt-500',
  },
  warning: {
    bg: 'bg-white border border-amber-200 ',
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
  },
}

export function Toast({ message, type = 'info', onClose, duration = 4000 }: ToastProps) {
  const cfg = toastConfig[type]
  const Icon = cfg.icon

  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  return createPortal(
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3.5 shadow-xl max-w-sm',
        'animate-in slide-in-from-bottom-4 fade-in-0 duration-300',
        cfg.bg
      )}
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0', cfg.iconClass)} />
      <p className="text-sm font-medium text-stone-800 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-stone-400 hover:text-stone-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>,
    document.body
  )
}

// ─── useToast hook ────────────────────────────────────────────────────────────

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const show = (message: string, type: ToastType = 'info') => setToast({ message, type })
  const hide = () => setToast(null)
  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hide} />
  ) : null
  return { show, hide, ToastComponent }
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onCancel}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              'text-stone-700 border border-stone-200 ',
              'hover:bg-stone-50 '
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60',
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-navy-800 hover:bg-navy-900 '
            )}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-stone-600 leading-relaxed">{description}</p>
    </Modal>
  )
}

// ─── Dropdown Menu ────────────────────────────────────────────────────────────

interface DropdownItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  separator?: boolean
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export function DropdownMenu({ trigger, items, align = 'right', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={cn('relative inline-block', className)} ref={ref}>
      <div onClick={() => setOpen(o => !o)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[180px] bg-white shadow-xl',
            'border border-stone-100 py-1.5',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) =>
            item.separator ? (
              <div key={i} className="my-1 border-t border-stone-100 " />
            ) : (
              <button
                key={i}
                onClick={() => { if (!item.disabled) { item.onClick(); setOpen(false) } }}
                disabled={item.disabled}
                className={cn(
                  'flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors',
                  item.danger
                    ? 'text-rose-700 hover:bg-rose-50 '
                    : 'text-stone-700 hover:bg-stone-50 ',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {item.icon && <span className="h-4 w-4 flex-shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ─── Drawer (side panel) ──────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  side?: 'left' | 'right'
  children: React.ReactNode
  width?: string
}

export function Drawer({ open, onClose, title, side = 'right', children, width = 'max-w-md' }: DrawerProps) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const slideClass = side === 'right'
    ? 'animate-in slide-in-from-right-full'
    : 'animate-in slide-in-from-left-full'

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div
        className={cn(
          'absolute inset-0 isolate bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200',
          side === 'right' ? 'mr-auto' : 'ml-auto'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'relative flex flex-col bg-white h-full w-full shadow-2xl',
          'border-stone-200 ',
          side === 'right' ? 'ml-auto border-l' : 'mr-auto border-r',
          width,
          `${slideClass} duration-300`
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 ">
            <h3 className="text-lg font-semibold text-stone-900 ">{title}</h3>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 transition-colors p-1.5 hover:bg-stone-100 "
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}

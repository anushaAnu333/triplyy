'use client';

import * as React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** One text field inside the modal (search, location, etc.). */
export type SearchFilterTextField = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Shown before the label for a11y; first field defaults to Search icon in the input */
  icon?: React.ReactNode;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};

export type SearchFiltersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Default: Search & filters */
  title?: string;
  description?: string;
  /** Text inputs (search, location, …). First row uses search icon in the input unless `icon` is set on the field. */
  fields?: SearchFilterTextField[];
  onClearAll: () => void;
  /** Optional extra controls (region/duration selects, quick filter buttons, etc.) */
  children?: React.ReactNode;
  className?: string;
  clearLabel?: string;
  applyLabel?: string;
};

/**
 * Modal shell for search + filters. State lives in the parent; this is presentational.
 * Use with {@link SearchFiltersTriggerButton} or {@link SearchFiltersStickyBar}.
 */
export function SearchFiltersModal({
  open,
  onOpenChange,
  title = 'Search & filters',
  description,
  fields = [],
  onClearAll,
  children,
  className,
  clearLabel = 'Clear all',
  applyLabel = 'Show results',
}: SearchFiltersModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-md',
          className
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {(fields ?? []).map((field, index) => {
            const inputId = field.id ?? `filter-field-${index}`;
            const showLeading = Boolean(field.icon) || index === 0;
            return (
              <div key={inputId} className="space-y-2">
                <Label htmlFor={inputId}>{field.label}</Label>
                <div className="relative">
                  {showLeading ? (
                    <span className="pointer-events-none absolute left-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
                      {field.icon ?? <Search aria-hidden />}
                    </span>
                  ) : null}
                  <Input
                    id={inputId}
                    type="text"
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onKeyDown={field.onKeyDown}
                    className={cn('h-11 pr-10', showLeading ? 'pl-10' : 'pl-3')}
                  />
                  {field.value ? (
                    <button
                      type="button"
                      onClick={() => field.onChange('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground"
                      aria-label={`Clear ${field.label}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          {children}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClearAll}>
            {clearLabel}
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {applyLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type SearchFiltersTriggerButtonProps = {
  onClick: () => void;
  activeCount?: number;
  className?: string;
  /** Default: Search & filters */
  label?: string;
};

/** Primary control to open the search/filters modal (badge shows active count). */
export function SearchFiltersTriggerButton({
  onClick,
  activeCount = 0,
  className,
  label = 'Search & filters',
}: SearchFiltersTriggerButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'rounded-full border-slate-200 bg-white shadow-sm',
        activeCount > 0 && 'border-primary/40',
        className
      )}
      onClick={onClick}
    >
      <SlidersHorizontal className="mr-2 h-4 w-4" />
      {label}
      {activeCount > 0 ? (
        <Badge variant="secondary" className="ml-2 rounded-full px-2">
          {activeCount}
        </Badge>
      ) : null}
    </Button>
  );
}

export type SearchFiltersStickyBarProps = {
  title: React.ReactNode;
  onOpenFilters: () => void;
  activeCount?: number;
  className?: string;
  containerClassName?: string;
  triggerLabel?: string;
  /** Extra content on the right before the trigger (e.g. another button) */
  endSlot?: React.ReactNode;
};

/** Sticky bar: title + search & filters trigger (matches destinations/packages listing pages). */
export function SearchFiltersStickyBar({
  title,
  onOpenFilters,
  activeCount,
  className,
  containerClassName,
  triggerLabel,
  endSlot,
}: SearchFiltersStickyBarProps) {
  return (
    <section
      className={cn(
        'sticky top-20 z-40 border-b bg-white shadow-sm',
        className
      )}
    >
      <div
        className={cn(
          'container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3',
          containerClassName
        )}
      >
        <div className="min-w-0 font-display text-lg font-semibold tracking-tight md:text-xl">
          {title}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {endSlot}
          <SearchFiltersTriggerButton
            onClick={onOpenFilters}
            activeCount={activeCount}
            label={triggerLabel}
          />
        </div>
      </div>
    </section>
  );
}

/** Count how many of the given predicates are true (for badge). */
export function countActiveFilters(flags: boolean[]): number {
  return flags.filter(Boolean).length;
}

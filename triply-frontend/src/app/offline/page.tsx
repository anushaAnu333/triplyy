'use client';

import { WifiOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="w-16 h-16 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold">You&apos;re offline</h1>
        <p className="text-muted-foreground">
          This page isn&apos;t available right now. Check your connection and try again.
        </p>
        <Button asChild>
          <Link href="/">Try again</Link>
        </Button>
      </div>
    </div>
  );
}

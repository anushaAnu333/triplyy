'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api/axios';
import { isImagePath, isPdfPath } from '@/lib/admin/onboardingDetailShared';

export interface AdminOnboardingDocumentPreviewProps {
  docKey: string;
  filePath: string;
  applicationId: string;
  /** Full URL for authenticated blob fetch (same pattern as merchant/referral APIs) */
  getDocumentUrl: (applicationId: string, docKey: string) => string;
  /** Optional: merchant detail “per-document approve” UI */
  perDocApprove?: { approved: boolean; onApprove: () => void };
  /** Show download button (referral detail previously had this) */
  showDownload?: boolean;
}

/** Image thumbnail / PDF open link; fetches with auth via axios */
export function AdminOnboardingDocumentPreview({
  docKey,
  filePath,
  applicationId,
  getDocumentUrl,
  perDocApprove,
  showDownload = false,
}: AdminOnboardingDocumentPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [openingPdf, setOpeningPdf] = useState(false);
  const blobUrlRef = useRef<string | null>(null);
  const isImage = isImagePath(filePath);
  const isPdf = isPdfPath(filePath);

  useEffect(() => {
    if (!isImage || !applicationId || !docKey) return;
    const url = getDocumentUrl(applicationId, docKey);
    api
      .get(url, { responseType: 'blob' })
      .then((res) => {
        const blob = res.data as Blob;
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;
        setImageUrl(blobUrl);
      })
      .catch(() => setImageError(true));
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [applicationId, docKey, isImage, getDocumentUrl]);

  const handleOpenPdf = () => {
    setOpeningPdf(true);
    const url = getDocumentUrl(applicationId, docKey);
    api
      .get(url, { responseType: 'blob' })
      .then((res) => {
        const blob = res.data as Blob;
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      })
      .catch(() => {})
      .finally(() => setOpeningPdf(false));
  };

  const handleDownload = async () => {
    const url = getDocumentUrl(applicationId, docKey);
    const res = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([res.data], {
      type: res.headers['content-type'] || 'application/octet-stream',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${docKey}-${applicationId}`;
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
  };

  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border rounded-md p-3">
      <div className="flex items-start gap-3">
        {isImage && (
          <div className="flex-shrink-0">
            {imageUrl && (
              <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={imageUrl}
                  alt={docKey}
                  className="h-20 w-20 rounded-md object-cover border border-border"
                />
              </a>
            )}
            {imageError && (
              <div className="h-20 w-20 rounded-md border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                Failed to load
              </div>
            )}
            {!imageUrl && !imageError && (
              <div className="h-20 w-20 rounded-md border border-border bg-muted flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
        <div className="text-sm space-y-1 min-w-0">
          <div className="font-semibold font-mono text-xs sm:text-sm">{docKey}</div>
          {isPdf && (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-primary"
              onClick={handleOpenPdf}
              disabled={openingPdf}
            >
              {openingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1 inline" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-1 inline" />
              )}
              Open PDF
            </Button>
          )}
          {isImage && imageUrl && (
            <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs block">
              Open image in new tab
            </a>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {showDownload && (
          <Button type="button" size="sm" variant="outline" onClick={() => void handleDownload()}>
            Download
          </Button>
        )}
        {perDocApprove && (
          <>
            {perDocApprove.approved && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Approved
              </span>
            )}
            <Button
              size="sm"
              variant={perDocApprove.approved ? 'outline' : 'secondary'}
              disabled={perDocApprove.approved}
              onClick={perDocApprove.onApprove}
            >
              {perDocApprove.approved ? 'Approved' : 'Approve'}
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BottomSheet } from "@/components/ui/bottom-sheet";

export function MicrositeLinkCard({ slug }: { slug: string }) {
  const [url, setUrl] = useState(`/${slug}`);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/${slug}`);
  }, [slug]);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 320, margin: 1, color: { dark: "#05080D", light: "#FFFFFF" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [url]);

  const copy = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: "Invest with me on Syndran", url }).catch(() => {});
    } else {
      copy();
    }
  };

  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">Your microsite</p>
      <p className="mt-1.5 truncate font-mono text-sm font-semibold text-brass-600" title={url}>{url}</p>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={copy}>
          <Copy className="size-3.5" /> Copy
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => setQrOpen(true)}>
          <QrCode className="size-3.5" /> QR
        </Button>
        <Button size="sm" className="flex-1" onClick={share}>
          <Share2 className="size-3.5" /> Share
        </Button>
      </div>

      <BottomSheet open={qrOpen} onOpenChange={setQrOpen} title="Scan to visit">
        <div className="flex flex-col items-center gap-3 py-2">
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR code" className="size-56 rounded-lg border border-border" />
          )}
          <p className="font-mono text-xs text-muted-foreground">{url}</p>
        </div>
      </BottomSheet>
    </Card>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Share2, Smartphone, Copy, Check } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { toast } from "sonner";
import { useState } from "react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postUrl: string;
  postCaption: string;
  title?: string;
}

const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TikTokIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.72a8.19 8.19 0 0 0 4.76 1.52V6.79a4.83 4.83 0 0 1-1-.1z" />
  </svg>
);

const FacebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export function ShareDialog({ open, onOpenChange, postUrl, postCaption, title = "Share this look" }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent("Check out this look on BelloNecta");
    const body = encodeURIComponent(`${postCaption}\n\n${postUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${postCaption}\n\n${postUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToSMS = () => {
    const text = encodeURIComponent(`${postCaption}\n\n${postUrl}`);
    window.open(`sms:?body=${text}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
  };

  const shareToPlatform = (platform: 'instagram' | 'tiktok') => {
    copyToClipboard();
    toast.success(`Link copied! Open ${platform === 'instagram' ? 'Instagram' : 'TikTok'} and paste it.`);
  };

  const shareOptions = [
    {
      label: "Copy Link",
      icon: copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />,
      onClick: copyToClipboard,
    },
    {
      label: "WhatsApp",
      icon: <WhatsAppIcon className="w-4 h-4" />,
      onClick: shareToWhatsApp,
    },
    {
      label: "Instagram",
      icon: <InstagramIcon className="w-4 h-4" />,
      onClick: () => shareToPlatform('instagram'),
    },
    {
      label: "TikTok",
      icon: <TikTokIcon className="w-4 h-4" />,
      onClick: () => shareToPlatform('tiktok'),
    },
    {
      label: "Facebook",
      icon: <FacebookIcon className="w-4 h-4" />,
      onClick: shareToFacebook,
    },
    {
      label: "Text Message",
      icon: <Smartphone className="w-4 h-4" />,
      onClick: shareToSMS,
    },
    {
      label: "Email",
      icon: <Mail className="w-4 h-4" />,
      onClick: shareToEmail,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2.5 pt-2 pb-1">
          {shareOptions.map((option) => (
            <Button
              key={option.label}
              variant="outline"
              onClick={option.onClick}
              className={`flex items-center gap-2.5 justify-start h-11 rounded-xl text-sm font-medium border-border/60 hover:bg-muted/60 hover:text-foreground transition-all ${
                option.label === "Email" ? "col-span-2" : ""
              }`}
            >
              {option.icon}
              {option.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface InviteProfessionalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: string, message: string, bio: string) => Promise<void>;
}

export function InviteProfessionalDialog({ 
  open, 
  onOpenChange, 
  onInvite 
}: InviteProfessionalDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !role) return;

    setSending(true);
    try {
      await onInvite(email.trim(), role, message.trim(), bio.trim());
      setEmail("");
      setRole("");
      setBio("");
      setMessage("");
      onOpenChange(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Professional</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Invite a beauty professional to join your team. They must have a BelloNecta account.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Professional Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="professional@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={sending} required>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stylist">Stylist</SelectItem>
                <SelectItem value="barber">Barber</SelectItem>
                <SelectItem value="nail_technician">Nail Technician</SelectItem>
                <SelectItem value="esthetician">Esthetician</SelectItem>
                <SelectItem value="massage_therapist">Massage Therapist</SelectItem>
                <SelectItem value="makeup_artist">Makeup Artist</SelectItem>
                <SelectItem value="receptionist">Receptionist</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Short Bio (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="A brief description of this professional's expertise..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={sending}
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">{bio.length}/300 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Invitation Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to your invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending || !email || !role}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

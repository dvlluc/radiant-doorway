import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Globe, Calendar, MessageSquare, MoreHorizontal, Users, Clock, Briefcase, Star, User, ShoppingCart, ArrowLeft, ChevronRight, UserPlus, UserCheck, Plus, Upload, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MessageCircle, Share2, Bookmark, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShareDialog } from "@/components/ShareDialog";
import { RatingBreakdown } from "@/components/RatingBreakdown";
import { InviteProfessionalDialog } from "@/components/business/InviteProfessionalDialog";
import { ProfileStylesTab } from "@/components/profile/ProfileStylesTab";
import { formatDate } from "@/utils/dateFormat";
import { useCanBookAsCustomer } from "@/hooks/useCanBookAsCustomer";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  attendee_count: number;
  price: number;
  image_urls: string[];
  video_url?: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  created_at: string;
}

interface BusinessPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
}

interface ProfileData {
  id: string;
  displayName: string;
  avatarUrl: string;
  email: string;
  telephone: string;
  location: string;
  website: string;
  bio: string;
  aboutUs?: string;
  accountType: string;
  followersCount: number;
  followingCount: number;
}

// Helper function to get display name based on account type
const getDisplayName = (
  accountType: string | undefined,
  businessName: string | undefined,
  brandName: string | undefined,
  organizationName: string | undefined,
  profile: any
): string => {
  if (accountType === 'business' && businessName) {
    return businessName;
  }
  if (accountType === 'brand' && brandName) {
    return brandName;
  }
  if (accountType === 'charitable_partner' && organizationName) {
    return organizationName;
  }
  // Individual or fallback
  return profile?.display_name || 
         `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 
         profile?.username || 
         'User';
};

// Recursive Comment Component
interface CommentItemProps {
  comment: any;
  onReply: (id: string, username: string) => void;
  onLike: (id: string) => void;
  commentLikes: Record<string, boolean>;
  depth: number;
}

const CommentItem = ({ comment, onReply, onLike, commentLikes, depth }: CommentItemProps) => {
  const navigate = useNavigate();
  const isLiked = commentLikes[comment.id] || false;
  const maxDepth = 3;
  const username = getDisplayName(
    comment.account_type,
    comment.business_name,
    comment.brand_name,
    comment.organization_name,
    comment.profiles
  );

  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={comment.profiles?.avatar_url} />
        <AvatarFallback>
          {(comment.profiles?.display_name?.[0] || comment.profiles?.username?.[0] || 'U').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div>
          <div className="mb-1">
            <button 
              onClick={() => comment.user_id && navigate(`/professional/${comment.user_id}`)}
              className="font-semibold text-sm mr-2 hover:opacity-80 transition-opacity"
            >
              {username}
            </button>
            <span className="text-sm">{comment.content}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
            <button
              onClick={() => onLike(comment.id)}
              className={`hover:text-foreground transition-colors ${isLiked ? 'font-semibold text-foreground' : ''}`}
            >
              {comment.likes_count > 0 && `${comment.likes_count} `}
              {isLiked ? 'Liked' : 'Like'}
            </button>
            {depth < maxDepth && (
              <button
                onClick={() => onReply(comment.id, username)}
                className="hover:text-foreground transition-colors"
              >
                Reply
              </button>
            )}
          </div>
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2 mt-3">
            {comment.replies.map((reply: any) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onLike={onLike}
                commentLikes={commentLikes}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProfessionalProfile() {
  const [activeTab, setActiveTab] = useState("Styles");
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { canBook } = useCanBookAsCustomer();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [businessPhotos, setBusinessPhotos] = useState<BusinessPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedBusinessPhoto, setSelectedBusinessPhoto] = useState<BusinessPhoto | null>(null);
  const [businessPhotoComments, setBusinessPhotoComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});
  const [appointmentBookingEnabled, setAppointmentBookingEnabled] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [businessServices, setBusinessServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [businessHours, setBusinessHours] = useState<any[]>([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: '',
    staff_member_id: 'general'
  });
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareData, setShareData] = useState<{ url: string; caption: string; title: string } | null>(null);
  
  // Portfolio upload state
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolioCaption, setPortfolioCaption] = useState("");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [portfolioPreview, setPortfolioPreview] = useState<string | null>(null);

  const handlePortfolioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPortfolioFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPortfolioPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePortfolioUpload = async () => {
    if (!portfolioFile || !currentUserId) return;
    setPortfolioUploading(true);
    try {
      const fileExt = portfolioFile.name.split(".").pop();
      const fileName = `${currentUserId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, portfolioFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("business_photos")
        .insert({
          user_id: currentUserId,
          photo_url: publicUrl,
          caption: portfolioCaption.trim() || null,
          display_order: businessPhotos.length,
          photo_type: "profile",
        });
      if (insertError) throw insertError;

      // Refresh photos
      const { data: newPhotos } = await supabase
        .from("business_photos")
        .select("*")
        .eq("user_id", id!)
        .eq("photo_type", "profile")
        .order("display_order", { ascending: true });
      if (newPhotos) setBusinessPhotos(newPhotos);

      setPortfolioDialogOpen(false);
      setPortfolioFile(null);
      setPortfolioPreview(null);
      setPortfolioCaption("");
      toast({ title: "Portfolio item added", description: "Your photo has been uploaded successfully." });
    } catch (error) {
      console.error("Error uploading portfolio item:", error);
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setPortfolioUploading(false);
    }
  };

  // Add Service state
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    currency_symbol: "£",
  });

  const handleAddService = async () => {
    if (!currentUserId || !serviceForm.name.trim() || !serviceForm.price || !serviceForm.duration) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setServiceSubmitting(true);
    try {
      const { error } = await supabase.from("services").insert({
        user_id: currentUserId,
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || null,
        price: parseFloat(serviceForm.price),
        duration: parseInt(serviceForm.duration),
        currency_symbol: serviceForm.currency_symbol,
        is_active: true,
      });
      if (error) throw error;

      await fetchBusinessServices();
      setServiceDialogOpen(false);
      setServiceForm({ name: "", description: "", price: "", duration: "", currency_symbol: "£" });
      toast({ title: "Service added", description: "Your new service is now listed." });
    } catch (error) {
      console.error("Error adding service:", error);
      toast({ title: "Failed to add service", variant: "destructive" });
    } finally {
      setServiceSubmitting(false);
    }
  };

  // Team invite state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [checkingTeamSubscription, setCheckingTeamSubscription] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const handleInviteClick = async () => {
    // First member is free, additional require subscription
    const activeCount = teamMembers.length;
    if (activeCount < 1) {
      setInviteDialogOpen(true);
      return;
    }
    setCheckingTeamSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-booking-subscription");
      if (error) throw error;
      if (data?.subscribed) {
        setInviteDialogOpen(true);
      } else {
        setUpgradeDialogOpen(true);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      toast({ title: "Could not verify subscription", variant: "destructive" });
    } finally {
      setCheckingTeamSubscription(false);
    }
  };

  const handleTeamInvite = async (email: string, role: string, message: string, bio: string) => {
    if (!currentUserId) return;

    // Get business name
    const { data: businessProfile } = await supabase
      .from("business_profiles")
      .select("business_name")
      .eq("user_id", currentUserId)
      .single();
    const businessName = businessProfile?.business_name || "A business";

    // Find user by email
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("email", email)
      .limit(1);

    if (!profiles || profiles.length === 0) {
      toast({ title: "User not found", description: "No user with this email exists on the platform.", variant: "destructive" });
      return;
    }

    const targetUser = profiles[0];

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("team_members")
      .insert({
        business_id: currentUserId,
        member_id: targetUser.id,
        email,
        role,
        invitation_message: message || null,
        bio: bio || null,
        status: "pending",
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // Send notification
    const notificationMessage = message
      ? `${businessName} has invited you to join their team as a ${role}. Message: "${message}"`
      : `${businessName} has invited you to join their team as a ${role}.`;

    await supabase.from("notifications").insert({
      user_id: targetUser.id,
      type: "team_invitation",
      title: "Team Invitation",
      message: notificationMessage,
      read: false,
      action_url: JSON.stringify({ type: "team_invitation", invitation_id: invitation.id }),
    });

    await fetchTeamMembers();
    toast({ title: "Invitation sent", description: `Invitation sent to ${targetUser.first_name || 'the user'}` });
  };


  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchProfileData();
      checkFollowStatus();
    }
  }, [id, currentUserId]);

  useEffect(() => {
    if (profile?.id) {
      if (activeTab === "Events") {
        fetchProfileEvents();
      } else if (activeTab === "Jobs") {
        fetchProfileJobs();
      } else if (activeTab === "Photos") {
        fetchBusinessPhotos();
      } else if (activeTab === "Styles") {
        fetchBusinessPhotos();
      } else if (activeTab === "Team" || activeTab === "Professionals") {
        fetchTeamMembers();
    } else if (activeTab === "Services & Hours" || activeTab === "Services") {
        fetchBusinessServices();
        fetchBusinessHours();
      } else if (activeTab === "Reviews") {
        fetchReviews();
        fetchTeamMembers();
      }
    }
  }, [activeTab, profile?.id]);

  useEffect(() => {
    if (selectedBusinessPhoto?.id) {
      fetchBusinessPhotoComments(selectedBusinessPhoto.id);
    }
  }, [selectedBusinessPhoto]);

  const checkFollowStatus = async () => {
    if (!currentUserId || !id) return;
    
    try {
      const { data } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("followed_id", id)
        .maybeSingle();
      
      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const fetchProfileData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // First try to get account type
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("account_type")
        .eq("user_id", id)
        .maybeSingle();

      let accountType = roleData?.account_type;
      
      // If no account type in user_roles, check profile tables directly
      if (!accountType) {
        const [businessCheck, brandCheck, charityCheck] = await Promise.all([
          supabase.from("business_profiles").select("user_id").eq("user_id", id).maybeSingle(),
          supabase.from("brand_profiles").select("user_id").eq("user_id", id).maybeSingle(),
          supabase.from("charitable_profiles").select("user_id").eq("user_id", id).maybeSingle()
        ]);
        
        if (businessCheck.data) {
          accountType = "business";
        } else if (brandCheck.data) {
          accountType = "brand";
        } else if (charityCheck.data) {
          accountType = "charitable_partner";
        } else {
          accountType = "individual";
        }
      }
      
      // Check if appointment booking is enabled for business accounts
      if (accountType === "business") {
        const { data: settingsData } = await supabase
          .from("business_settings")
          .select("appointment_booking_enabled")
          .eq("user_id", id)
          .maybeSingle();
        
        setAppointmentBookingEnabled(settingsData?.appointment_booking_enabled || false);
      }
      
      let profileData: ProfileData | null = null;
      let followersCount = 0;
      let followingCount = 0;

      // Get followers/following counts
      const { count: followersCountData } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("followed_id", id);
      
      const { count: followingCountData } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", id);

      followersCount = followersCountData || 0;
      followingCount = followingCountData || 0;

      // Also get shared profile fields as fallback
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("avatar_url, bio")
        .eq("id", id)
        .maybeSingle();

      const fallbackAvatarUrl = profilesData?.avatar_url || "";
      const fallbackBio = profilesData?.bio || "";

      // Fetch profile based on account type
      if (accountType === "brand") {
        const { data } = await supabase
          .from("brand_profiles")
          .select("*")
          .eq("user_id", id)
          .maybeSingle();
        
        if (data) {
          profileData = {
            id: data.user_id,
            displayName: data.brand_name,
            avatarUrl: data.logo_url || data.avatar_url || fallbackAvatarUrl,
            email: data.email,
            telephone: data.telephone || "",
            location: data.address || "",
            website: data.website || "",
            bio: "",
            aboutUs: data.about_us || fallbackBio,
            accountType: "brand",
            followersCount,
            followingCount
          };
        }
      } else if (accountType === "business") {
        const { data } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("user_id", id)
          .maybeSingle();
        
        if (data) {
          profileData = {
            id: data.user_id,
            displayName: data.business_name,
            avatarUrl: data.logo_url || data.avatar_url || fallbackAvatarUrl,
            email: data.email,
            telephone: data.telephone || "",
            location: data.address || "",
            website: data.website || "",
            bio: "",
            aboutUs: data.about_us || fallbackBio,
            accountType: "business",
            followersCount,
            followingCount
          };
        }
      } else if (accountType === "charitable_partner") {
        const { data } = await supabase
          .from("charitable_profiles")
          .select("*")
          .eq("user_id", id)
          .maybeSingle();
        
        if (data) {
          profileData = {
            id: data.user_id,
            displayName: data.organization_name,
            avatarUrl: data.logo_url || data.avatar_url || fallbackAvatarUrl,
            email: data.email,
            telephone: data.telephone || "",
            location: data.address || "",
            website: data.website || "",
            bio: "",
            aboutUs: data.about_us || fallbackBio,
            accountType: "charitable_partner",
            followersCount,
            followingCount
          };
        }
      } else {
        // Individual profile
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        
        if (data) {
          profileData = {
            id: data.id,
            displayName: data.display_name || `${data.first_name || ""} ${data.last_name || ""}`.trim() || data.username || "User",
            avatarUrl: data.avatar_url || "",
            email: data.email || "",
            telephone: data.telephone || "",
            location: "",
            website: "",
            bio: data.bio || "",
            accountType: "individual",
            followersCount,
            followingCount
          };
        }
      }

      setProfile(profileData);

      // Set available tabs based on account type
      let baseTabs: string[];
      
      if (accountType === "brand" || accountType === "business") {
        // Check if business wants to show opening hours
        const { data: settingsData } = await supabase
          .from("business_settings")
          .select("show_opening_hours")
          .eq("user_id", id)
          .maybeSingle();
        
        const showHours = settingsData?.show_opening_hours !== false;
        const servicesTabName = showHours ? "Services & Hours" : "Services";
        baseTabs = ["Styles", servicesTabName, "Team", "Store", "Reviews"];
      } else {
        baseTabs = ["Photos", "Events", "Jobs"];
      }
      
      setAvailableTabs(baseTabs);
      setActiveTab(baseTabs[0]);
      
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileEvents = async () => {
    if (!profile?.id) return;
    
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", profile.id)
        .order("date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching profile events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchProfileJobs = async () => {
    if (!profile?.id) return;
    
    setLoadingJobs(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching profile jobs:", error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchBusinessPhotos = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("business_photos")
        .select("*")
        .eq("user_id", profile.id)
        .eq("photo_type", "profile")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setBusinessPhotos(data || []);
    } catch (error) {
      console.error("Error fetching business photos:", error);
    }
  };

  const handleReplyToComment = (commentId: string, username: string) => {
    if (!currentUserId) {
      toast({ 
        title: "Authentication required",
        description: "Please log in to reply to comments"
      });
      return;
    }
    setReplyingTo({ id: commentId, username });
  };

  // Business Photo handlers
  const fetchBusinessPhotoComments = async (photoId: string) => {
    try {
      const { data, error } = await supabase
        .from("business_photo_comments")
        .select(`
          *,
          profiles:user_id (
            display_name,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("photo_id", photoId)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from("business_photo_comments")
            .select(`
              *,
              profiles:user_id (
                display_name,
                first_name,
                last_name,
                avatar_url
              )
            `)
            .eq("parent_comment_id", comment.id)
            .order("created_at", { ascending: true });

          return { ...comment, replies: replies || [] };
        })
      );

      setBusinessPhotoComments(commentsWithReplies);

      // Fetch like status for all comments
      if (currentUserId) {
        const allCommentIds = commentsWithReplies.flatMap(c => [
          c.id,
          ...((c.replies || []) as any[]).map((r: any) => r.id)
        ]);

        const { data: likes } = await supabase
          .from("business_photo_comment_likes")
          .select("comment_id")
          .eq("user_id", currentUserId)
          .in("comment_id", allCommentIds);

        const likesMap: Record<string, boolean> = {};
        likes?.forEach(like => {
          likesMap[like.comment_id] = true;
        });
        setCommentLikes(likesMap);
      }
    } catch (error) {
      console.error("Error fetching business photo comments:", error);
    }
  };

  const handleAddBusinessPhotoComment = async () => {
    if (!currentUserId || !selectedBusinessPhoto?.id || !newComment.trim()) {
      return;
    }

    try {
      const { error } = await supabase
        .from("business_photo_comments")
        .insert({
          photo_id: selectedBusinessPhoto.id,
          user_id: currentUserId,
          content: newComment.trim(),
          parent_comment_id: replyingTo?.id || null
        });

      if (error) throw error;

      setNewComment("");
      setReplyingTo(null);
      await fetchBusinessPhotoComments(selectedBusinessPhoto.id);
      
      toast({ title: replyingTo ? "Reply added" : "Comment added" });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const handleLikeBusinessPhotoComment = async (commentId: string) => {
    if (!currentUserId) {
      toast({ 
        title: "Authentication required",
        description: "Please log in to like comments"
      });
      return;
    }

    try {
      const isLiked = commentLikes[commentId];

      if (isLiked) {
        const { error } = await supabase
          .from("business_photo_comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", currentUserId);

        if (error) throw error;
        setCommentLikes(prev => ({ ...prev, [commentId]: false }));
      } else {
        const { error } = await supabase
          .from("business_photo_comment_likes")
          .insert({
            comment_id: commentId,
            user_id: currentUserId
          });

        if (error) throw error;
        setCommentLikes(prev => ({ ...prev, [commentId]: true }));
      }

      if (selectedBusinessPhoto?.id) {
        await fetchBusinessPhotoComments(selectedBusinessPhoto.id);
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      toast({
        title: "Error",
        description: "Failed to like comment",
        variant: "destructive"
      });
    }
  };

  const handleFollowClick = async () => {
    console.log('Follow button clicked', { currentUserId, id, isFollowing });
    
    if (!currentUserId) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow users",
        variant: "destructive"
      });
      return;
    }

    if (!id) {
      console.error('No profile ID available');
      return;
    }

    if (currentUserId === id) {
      toast({
        title: "Cannot follow yourself",
        description: "You cannot follow your own profile",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("followed_id", id);

        if (error) {
          console.error('Unfollow error:', error);
          throw error;
        }

        setIsFollowing(false);
        if (profile) {
          setProfile({
            ...profile,
            followersCount: Math.max(0, profile.followersCount - 1)
          });
        }
        
        toast({
          title: "Success",
          description: "Unfollowed successfully"
        });
      } else {
        // Follow
        const { error } = await supabase
          .from("user_follows")
          .insert({
            follower_id: currentUserId,
            followed_id: id
          });

        if (error) {
          console.error('Follow error:', error);
          throw error;
        }

        setIsFollowing(true);
        if (profile) {
          setProfile({
            ...profile,
            followersCount: profile.followersCount + 1
          });
        }
        
        toast({
          title: "Success",
          description: "Following successfully"
        });
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update follow status",
        variant: "destructive"
      });
    }
  };

  const fetchReviews = async () => {
    if (!id) return;
    
    setLoadingReviews(true);
    try {
      const isBrand = profile?.accountType === 'brand';

      const reviewsResult = await (supabase as any)
        .from('reviews')
        .select(`
          *,
          profiles:reviewer_id (
            first_name,
            last_name,
            display_name,
            avatar_url
          ),
          team_members:staff_member_id (
            id,
            member_id,
            email,
            title
          )
        `)
        .eq(isBrand ? 'brand_id' : 'business_id', id)
        .order('created_at', { ascending: false });

      if (reviewsResult.error) throw reviewsResult.error;

      const reviewsData = reviewsResult.data || [];
      const reviewerIds = reviewsData.map((r: { reviewer_id: string }) => r.reviewer_id).filter(Boolean);

      const [rolesResult, businessResult, brandResult, charityResult] = await Promise.all([
        reviewerIds.length > 0
          ? supabase.from("user_roles").select("user_id, account_type").in("user_id", reviewerIds)
          : Promise.resolve({ data: [] }),
        reviewerIds.length > 0
          ? supabase.from("business_profiles").select("user_id, business_name").in("user_id", reviewerIds)
          : Promise.resolve({ data: [] }),
        reviewerIds.length > 0
          ? supabase.from("brand_profiles").select("user_id, brand_name").in("user_id", reviewerIds)
          : Promise.resolve({ data: [] }),
        reviewerIds.length > 0
          ? supabase.from("charitable_profiles").select("user_id, organization_name").in("user_id", reviewerIds)
          : Promise.resolve({ data: [] }),
      ]);

      const accountTypeMap = new Map(rolesResult.data?.map(r => [r.user_id, r.account_type]) || []);
      const businessNameMap = new Map(businessResult.data?.map(b => [b.user_id, b.business_name]) || []);
      const brandNameMap = new Map(brandResult.data?.map(b => [b.user_id, b.brand_name]) || []);
      const organizationNameMap = new Map(charityResult.data?.map(c => [c.user_id, c.organization_name]) || []);

      const enrichedReviews = reviewsData.map((review: { reviewer_id: string }) => ({
        ...review,
        account_type: accountTypeMap.get(review.reviewer_id),
        business_name: businessNameMap.get(review.reviewer_id),
        brand_name: brandNameMap.get(review.reviewer_id),
        organization_name: organizationNameMap.get(review.reviewer_id),
      }));

      setReviews(enrichedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchTeamMembers = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, email, title, member_id, bio, specialties, phone, role')
        .eq('business_id', id)
        .eq('status', 'accepted');

      if (error) throw error;
      
      // Fetch profile data separately for each member
      if (data && data.length > 0) {
        // Fetch reviews for all staff members
        const teamMemberIds = data.map(m => m.id);
        const { data: staffReviews } = await supabase
          .from('reviews')
          .select('staff_member_id, rating')
          .in('staff_member_id', teamMemberIds);

        const reviewsByStaff: Record<string, number[]> = {};
        (staffReviews || []).forEach(r => {
          if (r.staff_member_id) {
            if (!reviewsByStaff[r.staff_member_id]) reviewsByStaff[r.staff_member_id] = [];
            reviewsByStaff[r.staff_member_id].push(r.rating);
          }
        });

        const membersWithProfiles = await Promise.all(
          data.map(async (member) => {
            const ratings = reviewsByStaff[member.id] || [];
            const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
            const reviewCount = ratings.length;

            if (member.member_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, display_name, avatar_url')
                .eq('id', member.member_id)
                .maybeSingle();
              
              return { ...member, profiles: profile, avgRating, reviewCount };
            }
            return { ...member, avgRating, reviewCount };
          })
        );
        setTeamMembers(membersWithProfiles);
      } else {
        setTeamMembers(data || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchBusinessServices = async () => {
    if (!id) return;
    setLoadingServices(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setBusinessServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchBusinessHours = async () => {
    if (!id) return;
    setLoadingHours(true);
    try {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('user_id', id);
      if (error) throw error;
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const sorted = (data || []).sort((a: any, b: any) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week));
      setBusinessHours(sorted);
    } catch (error) {
      console.error('Error fetching business hours:', error);
    } finally {
      setLoadingHours(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUserId) {
      toast({
        title: "Error",
        description: "You must be logged in to write a review",
        variant: "destructive"
      });
      return;
    }

    if (!reviewForm.title.trim() || !reviewForm.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          business_id: id,
          reviewer_id: currentUserId,
          staff_member_id: reviewForm.staff_member_id === 'general' ? null : reviewForm.staff_member_id,
          rating: reviewForm.rating,
          title: reviewForm.title,
          content: reviewForm.content
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your review has been submitted"
      });

      setWriteReviewOpen(false);
      setReviewForm({
        rating: 5,
        title: '',
        content: '',
        staff_member_id: 'general'
      });
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground mb-4">This profile doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/explore-styles")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const showContactInfo = profile.accountType === "brand" || profile.accountType === "business" || profile.accountType === "charitable_partner";
  const isOwnProfile = currentUserId === id;

  return (
    <div className="space-y-0 sm:space-y-8 max-w-5xl mx-auto px-0 sm:px-0 pb-20 md:pb-0">
      {/* Mobile Back Header */}
      <div className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-semibold truncate max-w-[200px]">{profile.displayName}</h2>
          <button 
            onClick={() => {
              const slugName = profile.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              setShareData({
                url: `${window.location.origin}/booking/${slugName}`,
                caption: `Book an appointment with ${profile.displayName}!`,
                title: "Share profile"
              });
              setShowShareDialog(true);
            }}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Header - Mobile */}
      <div className="md:hidden">
        {/* Avatar & Name Section */}
        <div className="flex items-center gap-4 px-4 pt-4 pb-3">
          <Avatar className="w-20 h-20 flex-shrink-0 ring-2 ring-border">
            <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
            <AvatarFallback className="text-2xl bg-muted">
              {profile.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{profile.displayName}</h1>
            {profile.accountType !== "individual" && (
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary capitalize">
                {profile.accountType === "charitable_partner" ? "Charity" : profile.accountType}
              </span>
            )}
            {/* Stats Row */}
            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <p className="text-sm font-bold">{profile.followersCount}</p>
                <p className="text-[10px] text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">{profile.followingCount}</p>
                <p className="text-[10px] text-muted-foreground">Following</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bio / About */}
        {(profile.aboutUs || profile.bio)?.trim() && (
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {(profile.aboutUs || profile.bio)?.trim()}
            </p>
          </div>
        )}

        {/* Contact Info - Compact */}
        {showContactInfo && (
          <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-muted-foreground">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs truncate max-w-[140px]">{profile.location}</span>
              </div>
            )}
            {profile.telephone && (
              <a href={`tel:${profile.telephone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">{profile.telephone}</span>
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs truncate max-w-[140px]">{profile.email}</span>
              </a>
            )}
            {profile.website && (
              <a 
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">Website</span>
              </a>
            )}
          </div>
        )}

        {/* Action Buttons - Full Width CTA */}
        <div className="px-4 pb-4 space-y-2">
          {profile.accountType === "business" && canBook && (
            <Button 
              className="w-full font-semibold text-sm h-11"
              onClick={() => navigate(`/booking/${id}`)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          )}
          <div className="flex gap-2">
            {!isOwnProfile && currentUserId && (
              <>
                <Button
                  variant={isFollowing ? "outline" : "secondary"}
                  className={`flex-1 font-semibold text-xs h-9 ${isFollowing ? "border-accent text-accent hover:bg-accent/10" : ""}`}
                  onClick={handleFollowClick}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                      Follow
                    </>
                  )}
                </Button>
              </>
            )}
            {isOwnProfile && (
              <Button
                variant="outline"
                className="flex-1 font-semibold text-xs h-9"
                onClick={() => navigate('/account')}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Header - Desktop */}
      <div className="hidden md:flex flex-row gap-8 items-start">
        <Avatar className="w-40 h-40 flex-shrink-0">
          <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
          <AvatarFallback className="text-4xl">
            {profile.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-4 text-left w-full">
          <div className="flex flex-row items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              <div className="flex justify-start gap-6 mt-2 text-sm">
                <span><strong>{profile.followingCount}</strong> Following</span>
                <span><strong>{profile.followersCount}</strong> Followers</span>
              </div>
              {profile.accountType === "individual" && profile.bio && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Contact Information for Business Accounts - Desktop */}
          {showContactInfo && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap justify-start gap-4 text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
                {profile.telephone && (
                  <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">{profile.telephone}</span>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Mail className="w-5 h-5" />
                    <span className="text-sm">{profile.email}</span>
                  </div>
                )}
                {profile.website && (
                  <a 
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
              {(profile.aboutUs || profile.bio)?.trim() && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">About Us:</span> {(profile.aboutUs || profile.bio)?.trim()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* About Section - only for business accounts now */}
          {profile.bio && profile.accountType !== "individual" && (
            <div className="space-y-1">
              <h3 className="font-semibold text-base">About {profile.accountType === "individual" ? "me" : "us"}</h3>
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            </div>
          )}

          {/* Action Buttons - Desktop */}
          <div className="flex flex-wrap justify-start gap-3">
            {profile.accountType === "business" && canBook && (
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 text-sm"
                size="sm"
                onClick={() => navigate(`/booking/${id}`)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            )}
            <Button 
              variant="outline" 
              className="font-semibold px-6 text-sm"
              size="sm"
              onClick={() => {
                const slugName = profile.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                setShareData({
                  url: `${window.location.origin}/booking/${slugName}`,
                  caption: `Book an appointment with ${profile.displayName} on BelloNecta!`,
                  title: "Share your booking page so clients can book instantly"
                });
                setShowShareDialog(true);
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Booking Link
            </Button>
            <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-muted border">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border px-4 md:px-0">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-3 md:px-4 font-medium transition-colors relative whitespace-nowrap text-xs md:text-base ${
                activeTab === tab 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-4 md:py-8 px-4 md:px-0">
        {activeTab === "Photos" && (
          businessPhotos.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Photos</h3>
                <p className="text-muted-foreground">This user hasn't posted any photos yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {businessPhotos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedBusinessPhoto(photo)}
                >
                  <img src={photo.photo_url} alt={photo.caption || ""} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === "Events" && (
          loadingEvents ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm sm:text-base">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <Calendar className="w-10 h-10 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">No Events</h3>
                <p className="text-muted-foreground text-sm sm:text-base">This user hasn't created any events yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-6">
              {events.map((event) => (
                <Card 
                  key={event.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row gap-0 sm:gap-6">
                      <div className="w-full sm:w-48 md:w-64 h-40 sm:h-36 md:h-48 flex-shrink-0 bg-muted">
                        {event.image_urls && event.image_urls.length > 0 ? (
                          <img
                            src={event.image_urls[0]}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3 sm:py-4 sm:pr-6 sm:pl-0 md:py-6">
                        <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 truncate">{event.title}</h3>
                            {event.category && (
                              <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-primary/10 text-primary">
                                {event.category}
                              </span>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base sm:text-lg md:text-xl font-bold">${event.price}</p>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="truncate">{formatDate(event.date)}</span>
                          </div>
                          {event.time && (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{event.time}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 sm:gap-2">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="truncate max-w-[120px] sm:max-w-none">{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {activeTab === "Jobs" && (
          loadingJobs ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Job Listings</h3>
                <p className="text-muted-foreground">This user hasn't posted any jobs yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card 
                  key={job.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
                        <p className="text-muted-foreground">{job.company}</p>
                      </div>
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary">
                        {job.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <span>•</span>
                      <span>{job.salary}</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 mb-4">{job.description}</p>
                    <Button variant="outline">View Details</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {(activeTab === "Professionals" || activeTab === "Team") && (
          <div className="space-y-6">
            {isOwnProfile && (
              <Button
                variant="outline"
                className="w-full h-11 border-dashed border-2 text-muted-foreground hover:text-foreground"
                onClick={handleInviteClick}
                disabled={checkingTeamSubscription}
              >
                {checkingTeamSubscription ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Team Member
              </Button>
            )}

            {/* Invite Professional Dialog */}
            <InviteProfessionalDialog
              open={inviteDialogOpen}
              onOpenChange={setInviteDialogOpen}
              onInvite={handleTeamInvite}
            />

            {/* Upgrade Dialog */}
            <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Subscription Required</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Your first team member is free. To add more team members, you need an active booking subscription.
                  </p>
                  <Button className="w-full" onClick={() => { setUpgradeDialogOpen(false); navigate("/account", { state: { section: "Purchases & Subscriptions" } }); }}>
                    View Subscription Plans
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {teamMembers.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Team Members Yet</h3>
                <p className="text-muted-foreground mt-1">This business hasn't added any staff members yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((member) => (
                  <Card key={member.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-3">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={member.profiles?.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(member.profiles?.first_name?.[0] || member.email?.[0] || "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-semibold truncate">
                              {member.profiles?.first_name || member.email}
                            </h4>
                            <div className="h-4 w-px bg-border shrink-0" />
                            <div className="flex items-center gap-1 shrink-0">
                              <Star className={`w-3.5 h-3.5 ${member.reviewCount > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                              <span className="text-sm font-medium">
                                {member.reviewCount > 0 ? member.avgRating.toFixed(1) : '-'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {member.reviewCount > 0 
                                  ? `(${member.reviewCount} review${member.reviewCount !== 1 ? 's' : ''})` 
                                  : '(No reviews)'}
                              </span>
                            </div>
                          </div>
                          {(member.title?.trim() || member.role?.trim()) && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{member.title?.trim() || member.role?.trim()}</p>
                          )}
                        </div>
                      </div>
                      {member.specialties && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">Specialties:</span> {member.specialties}
                        </p>
                      )}
                      {member.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-3">{member.bio}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {(activeTab === "Services & Hours" || activeTab === "Services") && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Services - Left/Main Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Our Services</h3>
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setServiceForm({ name: "", description: "", price: "", duration: "", currency_symbol: "£" });
                      setServiceDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Service
                  </Button>
                )}
              </div>

              {/* Add Service Dialog */}
              <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Service</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="service-name">Service Name *</Label>
                      <Input
                        id="service-name"
                        placeholder="e.g. Haircut, Manicure..."
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service-desc">Description</Label>
                      <Textarea
                        id="service-desc"
                        placeholder="Describe this service..."
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm(f => ({ ...f, description: e.target.value }))}
                        className="resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="service-price">Price ({serviceForm.currency_symbol}) *</Label>
                        <Input
                          id="service-price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={serviceForm.price}
                          onChange={(e) => setServiceForm(f => ({ ...f, price: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service-duration">Duration (min) *</Label>
                        <Input
                          id="service-duration"
                          type="number"
                          min="1"
                          placeholder="30"
                          value={serviceForm.duration}
                          onChange={(e) => setServiceForm(f => ({ ...f, duration: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      disabled={!serviceForm.name.trim() || !serviceForm.price || !serviceForm.duration || serviceSubmitting}
                      onClick={handleAddService}
                    >
                      {serviceSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Service"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {loadingServices ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading services...</p>
                </div>
              ) : businessServices.length === 0 ? (
                <Card className="p-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Services Listed</h3>
                  <p className="text-muted-foreground mt-1">This business hasn't added any services yet.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {businessServices.map((service) => (
                    <Card key={service.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{service.name}</h4>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
                            )}
                            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              {service.duration} min
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              {service.discount_active && service.original_price ? (
                                <div>
                                  <span className="text-xs text-muted-foreground line-through block">
                                    {service.currency_symbol || '£'}{service.original_price}
                                  </span>
                                  <span className="font-bold text-primary">
                                    {service.currency_symbol || '£'}{service.price}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-bold text-primary">
                                  {service.currency_symbol || '£'}{service.price}
                                </span>
                              )}
                            </div>
                            {canBook && (
                              <Button
                                size="sm"
                                onClick={() => navigate(`/booking/${id}`, { state: { preSelectedService: service } })}
                              >
                                Book
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Opening Hours - Right Column (only when tab includes Hours) */}
            {activeTab === "Services & Hours" && (
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Opening Hours
                  </h3>
                  {loadingHours ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : businessHours.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hours listed.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {businessHours.map((h: any) => {
                        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                        const isToday = h.day_of_week === today;
                        return (
                          <div
                            key={h.id}
                            className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-md ${isToday ? 'bg-primary/10 font-medium' : ''}`}
                          >
                            <span className={isToday ? 'text-primary' : 'text-foreground'}>
                              {h.day_of_week.slice(0, 3)}
                            </span>
                            <span className={h.is_open ? (isToday ? 'text-primary' : 'text-muted-foreground') : 'text-destructive'}>
                              {h.is_open ? `${h.open_time} - ${h.close_time}` : 'Closed'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            )}
          </div>
        )}

        {activeTab === "Reviews" && (
          <div className="space-y-6">
            {/* Write Review Button */}
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  if (!currentUserId) {
                    toast({
                      title: "Sign in required",
                      description: "Please sign in or sign up to write a review.",
                    });
                  } else {
                    setWriteReviewOpen(true);
                  }
                }}
              >
                <Star className="w-4 h-4 mr-2" />
                Write a Review
              </Button>
            </div>

            {loadingReviews ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
                  <p className="text-muted-foreground">Be the first to review this business!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-[350px_1fr] gap-6">
                  {/* Left: Rating Breakdown - Sticky */}
                  <div className="md:sticky md:top-6 md:self-start">
                    <RatingBreakdown 
                      reviews={reviews} 
                      onRatingFilter={setSelectedRatingFilter}
                      selectedRating={selectedRatingFilter}
                    />
                  </div>

                  {/* Right: Reviews List */}
                  <div className="space-y-4">
                    {reviews
                      .filter(review => selectedRatingFilter === null || review.rating === selectedRatingFilter)
                      .map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <Avatar className="w-12 h-12 flex-shrink-0">
                            <AvatarImage src={review.profiles?.avatar_url} />
                            <AvatarFallback>
                              {(getDisplayName(
                                review.account_type,
                                review.business_name,
                                review.brand_name,
                                review.organization_name,
                                review.profiles
                              )?.[0] || 'U').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <p className="font-semibold">
                                    {getDisplayName(
                                      review.account_type,
                                      review.business_name,
                                      review.brand_name,
                                      review.organization_name,
                                      review.profiles
                                    )}
                                  </p>
                                  {review.team_members && (
                                    <p className="text-sm text-muted-foreground">
                                      Reviewed: {review.team_members.title || review.team_members.email}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? 'fill-black text-black'
                                          : 'text-muted'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">{review.title}</h4>
                              <p className="text-sm text-muted-foreground">{review.content}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Styles" && (
          <ProfileStylesTab professionalId={id!} isOwnProfile={isOwnProfile} />
        )}

        {activeTab === "Store" && (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Store Coming Soon</h3>
              <p className="text-muted-foreground">This business hasn't set up their store yet.</p>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Share Dialog */}
      {shareData && (
        <ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          postUrl={shareData.url}
          postCaption={shareData.caption}
          title={shareData.title}
        />
      )}

      {/* Business Photo Detail Dialog */}
      <Dialog open={!!selectedBusinessPhoto} onOpenChange={(open) => {
        if (!open) {
          setSelectedBusinessPhoto(null);
          setBusinessPhotoComments([]);
          setNewComment("");
        } else if (selectedBusinessPhoto) {
          fetchBusinessPhotoComments(selectedBusinessPhoto.id);
        }
      }}>
        <DialogContent className="max-w-6xl h-[85vh] overflow-hidden p-0 gap-0">
          <VisuallyHidden>
            <DialogTitle>Business Photo</DialogTitle>
          </VisuallyHidden>
          {selectedBusinessPhoto && profile && (
            <div className="grid grid-cols-1 md:grid-cols-2 h-full">
              {/* Left: Photo and Reactions */}
              <div className="bg-black flex flex-col">
                {/* Photo */}
                <div className="flex-1 flex items-center justify-center p-4">
                  <img
                    src={selectedBusinessPhoto.photo_url}
                    alt={selectedBusinessPhoto.caption || "Business photo"}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                
                {/* Reaction Buttons Row */}
                <div className="border-t border-white/10 px-4 py-3 flex items-center justify-around gap-4 bg-black/50 backdrop-blur-sm">
                  <button 
                    onClick={() => {
                      // Scroll to comment input
                      const commentInput = document.querySelector('textarea[placeholder*="comment"]') as HTMLTextAreaElement;
                      commentInput?.focus();
                    }}
                    className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-white">{businessPhotoComments.length}</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      toast({
                        title: "Saved!",
                        description: "Photo saved to your collection"
                      });
                    }}
                    className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <Bookmark className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-white">Save</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      const url = `${window.location.origin}/professional/${profile.id}`;
                      if (navigator.share) {
                        navigator.share({
                          title: `${profile.displayName}'s Photo`,
                          url: url
                        });
                      } else {
                        navigator.clipboard.writeText(url);
                        toast({
                          title: "Link copied!",
                          description: "Photo link copied to clipboard"
                        });
                      }
                    }}
                    className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-white">Share</span>
                  </button>
                  
                  {profile?.website && (
                    <a 
                      href={profile.website.startsWith('http://') || profile.website.startsWith('https://') 
                        ? profile.website 
                        : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs font-medium text-white">Web</span>
                    </a>
                  )}
                </div>
              </div>
              
              {/* Right: Photo Details & Comments */}
              <div className="flex flex-col h-full bg-card min-h-0">
                {/* Photo Header */}
                <div className="p-4 flex items-center gap-3 border-b shrink-0">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profile.avatarUrl || ''} />
                    <AvatarFallback>
                      {profile.displayName?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    onClick={() => navigate(`/professional/${profile.id}`)}
                    className="font-semibold text-sm hover:opacity-80 transition-opacity"
                  >
                    {profile.displayName}
                  </button>
                </div>

                {/* Comments Section */}
                <ScrollArea className="flex-1 min-h-0 p-4">
                  {/* Caption if available */}
                  {selectedBusinessPhoto.caption && (
                    <div className="flex gap-3 mb-6">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={profile.avatarUrl || ''} />
                        <AvatarFallback>
                          {profile.displayName?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="mb-1">
                          <button 
                            onClick={() => navigate(`/professional/${profile.id}`)}
                            className="font-semibold text-sm mr-2 hover:opacity-80 transition-opacity"
                          >
                            {profile.displayName}
                          </button>
                          <span className="text-sm">{selectedBusinessPhoto.caption}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(selectedBusinessPhoto.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-4">
                    {businessPhotoComments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        onReply={handleReplyToComment}
                        onLike={handleLikeBusinessPhotoComment}
                        commentLikes={commentLikes}
                        depth={0}
                      />
                    ))}
                    
                    {businessPhotoComments.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        No comments yet. Be the first to comment!
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Comment Input */}
                <div className="border-t p-4 shrink-0 bg-card">
                  {currentUserId ? (
                    <div>
                      {replyingTo && (
                        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Replying to @{replyingTo.username}</span>
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="hover:text-foreground"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Textarea
                          placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
                          className="min-h-[40px] max-h-[100px] resize-none"
                          rows={1}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddBusinessPhotoComment();
                            }
                          }}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="flex-shrink-0"
                          onClick={handleAddBusinessPhotoComment}
                          disabled={!newComment.trim()}
                        >
                          <Send className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      <button
                        onClick={() => navigate('/auth')}
                        className="text-primary hover:underline"
                      >
                        Log in
                      </button>
                      {' '}to comment
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Write Review Dialog */}
      <Dialog open={writeReviewOpen} onOpenChange={setWriteReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Write a Review</DialogTitle>
          <div className="space-y-6 py-4">
            {/* Staff Member Selection */}
            <div className="space-y-2">
              <Label>Staff Member (Optional)</Label>
              <Select
                value={reviewForm.staff_member_id}
                onValueChange={(value) => setReviewForm({ ...reviewForm, staff_member_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a staff member or leave blank for general review" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Review (No specific staff)</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.profiles?.first_name || 
                       member.title || 
                       member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        rating <= reviewForm.rating
                          ? 'fill-black text-black'
                          : 'text-muted hover:text-black/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Title */}
            <div className="space-y-2">
              <Label htmlFor="review-title">Review Title</Label>
              <Input
                id="review-title"
                placeholder="Summarize your experience"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              />
            </div>

            {/* Review Content */}
            <div className="space-y-2">
              <Label htmlFor="review-content">Your Review</Label>
              <Textarea
                id="review-content"
                placeholder="Share details of your experience..."
                className="min-h-[150px]"
                value={reviewForm.content}
                onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setWriteReviewOpen(false);
                  setReviewForm({ rating: 5, title: '', content: '', staff_member_id: 'general' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitReview}>
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

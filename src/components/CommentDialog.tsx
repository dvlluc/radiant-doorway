import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Bookmark, Globe, BadgeCheck, Send } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Recursive comment item component
function CommentItem({ 
  comment, 
  onReply, 
  level 
}: { 
  comment: Comment; 
  onReply: (id: string, name: string) => void; 
  level: number;
}) {
  const navigate = useNavigate();
  const maxLevel = 3; // Limit nesting depth
  const indent = Math.min(level, maxLevel) * 2.5; // 2.5rem per level, max 3 levels

  return (
    <div style={{ marginLeft: `${indent}rem` }} className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={comment.profiles?.avatar_url} />
          <AvatarFallback>
            {comment.profiles?.display_name?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <button 
              onClick={() => comment.user_id && navigate(`/professional/${comment.user_id}`)}
              className="font-semibold text-sm hover:opacity-80 transition-opacity"
            >
              {comment.profiles?.display_name || "User"}
            </button>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          <div className="text-sm break-words text-left max-h-32 overflow-y-auto whitespace-pre-wrap">
            {comment.content}
          </div>
          <button
            onClick={() => onReply(comment.id, comment.profiles?.display_name || "User")}
            className="text-xs text-muted-foreground hover:text-foreground mt-1"
          >
            Reply
          </button>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
  replies?: Comment[];
}

interface CommentDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postImage: string;
  postVideoUrl?: string;
  postCaption: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
  timestamp?: string;
  onCommentAdded?: () => void;
  website?: string;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: () => void;
  onSave?: () => void;
  authorId?: string;
  postType?: string;
}

// Helper to check if ID is a valid UUID
const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export function CommentDialog({ 
  postId, 
  open, 
  onOpenChange, 
  postImage,
  postVideoUrl, 
  postCaption, 
  username, 
  avatar,
  isVerified = false,
  timestamp,
  onCommentAdded,
  website,
  likesCount = 0,
  commentsCount = 0,
  sharesCount = 0,
  isLiked = false,
  isSaved = false,
  onLike,
  onSave,
  authorId,
  postType
}: CommentDialogProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidPost, setIsValidPost] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToName, setReplyingToName] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const valid = isValidUUID(postId);
    setIsValidPost(valid);
    if (open && valid) {
      fetchComments();
    }
  }, [open, postId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("post_comments")
      .select("id, user_id, content, created_at, parent_comment_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    // Fetch profiles and account types for each comment
    const userIds = [...new Set(data?.map(c => c.user_id) || [])];
    
    const [profiles, userRoles, businessProfiles, brandProfiles, charitableProfiles] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds),
      supabase.from("user_roles").select("user_id, account_type").in("user_id", userIds),
      supabase.from("business_profiles").select("user_id, business_name").in("user_id", userIds),
      supabase.from("brand_profiles").select("user_id, brand_name").in("user_id", userIds),
      supabase.from("charitable_profiles").select("user_id, organization_name").in("user_id", userIds)
    ]);

    // Create maps for quick lookup
    const profileMap = new Map(profiles.data?.map(p => [p.id, p]) || []);
    const accountTypeMap = new Map(userRoles.data?.map(r => [r.user_id, r.account_type]) || []);
    const displayNameMap = new Map<string, string>();
    
    businessProfiles.data?.forEach(p => {
      if (p.business_name) {
        displayNameMap.set(p.user_id, p.business_name);
      }
    });
    
    brandProfiles.data?.forEach(p => {
      if (p.brand_name) {
        displayNameMap.set(p.user_id, p.brand_name);
      }
    });
    
    charitableProfiles.data?.forEach(p => {
      if (p.organization_name) {
        displayNameMap.set(p.user_id, p.organization_name);
      }
    });

    const commentsWithProfiles = data?.map(comment => {
      const profile = profileMap.get(comment.user_id);
      const accountType = accountTypeMap.get(comment.user_id);
      let displayName = "User";
      
      // Get display name based on account type - NEVER use personal names for businesses
      if (accountType === "business") {
        displayName = displayNameMap.get(comment.user_id) || "Business User";
      } else if (accountType === "brand") {
        displayName = displayNameMap.get(comment.user_id) || "Brand";
      } else if (accountType === "charitable_partner") {
        displayName = displayNameMap.get(comment.user_id) || "Organization";
      } else {
        // Only for individual accounts
        displayName = profile?.display_name || "User";
      }
      
      return {
        ...comment,
        profiles: {
          display_name: displayName,
          avatar_url: profile?.avatar_url || ""
        }
      };
    }) || [];

    // Build nested comment structure
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create all comment objects
    commentsWithProfiles.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into tree structure
    commentsWithProfiles.forEach(comment => {
      const commentObj = commentMap.get(comment.id);
      if (!commentObj) return;

      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    setComments(rootComments);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    if (!isValidPost) {
      toast({
        title: "Demo post",
        description: "Sign in and create a real post to enable comments",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
        parent_comment_id: replyingTo,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      setReplyingTo(null);
      setReplyingToName("");
      fetchComments();
      onCommentAdded?.();
      toast({
        title: replyingTo ? "Reply posted" : "Comment posted",
        description: replyingTo ? "Your reply has been added" : "Your comment has been added",
      });
    }

    setLoading(false);
  };

  const handleReply = (commentId: string, userName: string) => {
    setReplyingTo(commentId);
    setReplyingToName(userName);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyingToName("");
  };

  const getTimeAgo = () => {
    if (!timestamp) return "Just now";
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Just now";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[100dvh] md:h-[90vh] p-0 gap-0">
        <VisuallyHidden>
          <DialogTitle>Post Comments</DialogTitle>
          <DialogDescription>View and add comments to this post</DialogDescription>
        </VisuallyHidden>
        
        <div className="flex flex-col md:flex-row h-full">
          {/* Left side - Post Image/Video */}
          <div className="flex-1 md:w-1/2 bg-black flex items-start justify-center relative p-4 pr-16 md:pr-24 pt-8 md:pt-16 min-h-[45vh] md:min-h-0">
            {postVideoUrl ? (
              <video
                src={postVideoUrl}
                controls
                className="max-w-full max-h-full"
                style={{ maxHeight: 'calc(90vh - 2rem)' }}
              />
            ) : postImage && postImage !== '/placeholder.svg' ? (
              <img 
                src={postImage} 
                alt={postCaption}
                className="max-w-full max-h-full object-contain"
              />
            ) : postType === 'tip' ? (
              <div className="w-full max-w-md space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
                    </svg>
                  </div>
                  <div className="inline-block px-4 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">
                    PRO TIP
                  </div>
                </div>
                <div className="text-white text-lg leading-relaxed text-left whitespace-pre-wrap max-h-[60vh] overflow-y-auto scrollbar-hide">{postCaption}</div>
              </div>
            ) : postType === 'question' ? (
              <div className="w-full max-w-md space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="inline-block px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold">
                    QUESTION
                  </div>
                </div>
                <div className="text-white text-lg leading-relaxed text-left whitespace-pre-wrap max-h-[60vh] overflow-y-auto scrollbar-hide">{postCaption}</div>
              </div>
            ) : (
              <div className="w-full max-w-md px-8">
                <div className="text-white text-lg leading-relaxed text-left whitespace-pre-wrap max-h-[60vh] overflow-y-auto scrollbar-hide">{postCaption}</div>
              </div>
            )}
            
            {/* Reaction Buttons - Right side vertical stack (TikTok style) */}
            <div className="absolute right-3 md:right-4 bottom-4 md:bottom-20 flex flex-col items-center gap-3 md:gap-4">
              <button 
                onClick={onLike}
                className="flex flex-col items-center gap-0.5 md:gap-1 hover:opacity-70 transition-opacity"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                  <Heart className={`w-5 h-5 md:w-6 md:h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-white">{likesCount}</span>
              </button>
              
              <button className="flex flex-col items-center gap-0.5 md:gap-1 hover:opacity-70 transition-opacity">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-white">{commentsCount}</span>
              </button>
              
              <button 
                onClick={onSave}
                className="flex flex-col items-center gap-0.5 md:gap-1 hover:opacity-70 transition-opacity"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                  <Bookmark className={`w-5 h-5 md:w-6 md:h-6 ${isSaved ? 'fill-current text-white' : 'text-white'}`} />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-white">Save</span>
              </button>
              
              <button className="flex flex-col items-center gap-0.5 md:gap-1 hover:opacity-70 transition-opacity">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                  <Share2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-white">Share</span>
              </button>
              
              {website && (
                <a 
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-0.5 md:gap-1 hover:opacity-70 transition-opacity"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                    <Globe className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-white">Web</span>
                </a>
              )}
            </div>
          </div>

          {/* Right side - Comments */}
          <div className="flex-1 md:w-1/2 flex flex-col max-h-[55vh] md:max-h-none">
            {/* Header with user info */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={avatar} />
                  <AvatarFallback>{username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <button 
                    onClick={() => authorId && navigate(`/professional/${authorId}`)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <span className="font-semibold text-sm">{username || "User"}</span>
                    {isVerified && (
                      <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />
                    )}
                  </button>
                  <span className="text-xs text-muted-foreground block">{getTimeAgo()}</span>
                </div>
              </div>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!isValidPost ? (
                <p className="text-center text-muted-foreground py-8">
                  This is a demo post. Sign in and create a real post to enable comments.
                </p>
              ) : comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                    level={0}
                  />
                ))
              )}
            </div>

            {/* Add comment input */}
            <div className="p-4 border-t border-border">
              {replyingTo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded mb-2">
                  <span>Replying to {replyingToName}</span>
                  <button
                    onClick={cancelReply}
                    className="ml-auto text-foreground hover:text-destructive"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder={isValidPost ? (replyingTo ? `Reply to ${replyingToName}...` : "Add a comment...") : "Sign in to comment"}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                  disabled={!isValidPost}
                  className="flex-1 px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  size="icon"
                  onClick={handleSubmitComment}
                  disabled={loading || !newComment.trim() || !isValidPost}
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

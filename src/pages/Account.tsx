import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useLocation, Link } from "react-router-dom"; // Link for footer navigation
import { useAuth } from "@/contexts/AuthContext";
import { 
  Shield, 
  Bookmark, 
  Bell, 
  Users, 
  Heart,
  Calendar,
  MessageCircle,
  Briefcase,
  Home,
  FileText,
  ThumbsUp,
  Menu,
  X,
  ChevronLeft
} from "lucide-react";
import { PersonalInformationForm } from "@/components/PersonalInformationForm";
import { formatDate } from "@/utils/dateFormat";
import { AccountSettings } from "@/components/AccountSettings";
import { NotificationsPage } from "@/components/NotificationsPage";
import { SavedItemsSection } from "@/components/SavedItemsSection";
import { FollowersSection } from "@/components/FollowersSection";
import { MyBookingsPage } from "@/components/MyBookingsPage";

import { BusinessManagement } from "@/components/BusinessManagement";
import { TeamMemberPage } from "@/components/TeamMemberPage";
import { PurchasesSubscriptions } from "@/components/PurchasesSubscriptions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
type MenuSection =
  | "Home" 
  | "Overview" 
  | "Personal Information"
  | "Brand Information"
  | "Business Information"
  | "Charity Information"
  | "Account Settings" 
  | "Notifications"
  | "My Bookings" 
  | "Bookings"
  | "Purchases & Subscriptions" 
  | "Business Management"
  
  | "Saved Items"
  | "Followers"
  | "Team Member";

const individualMenuItems: MenuSection[] = [
  "Home",
  "Overview",
  "Personal Information",
  "Account Settings",
  "Notifications",
  "My Bookings",
  "Purchases & Subscriptions",
];

const businessMenuItems: MenuSection[] = [
  "Home",
  "Overview",
  "Business Information",
  "Account Settings",
  "Notifications",
  "Bookings",
  "Purchases & Subscriptions",
  "Business Management",
];

const brandMenuItems: MenuSection[] = [
  "Home",
  "Overview",
  "Brand Information",
  "Account Settings",
  "Notifications",
  "My Bookings",
  "Purchases & Subscriptions",
];

const charitableMenuItems: MenuSection[] = [
  "Home",
  "Overview",
  "Charity Information",
  "Account Settings",
  "Notifications",
  "My Bookings",
  "Purchases & Subscriptions",
  
];

export default function Account() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<MenuSection>("Overview");
  const [accountType, setAccountType] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [savedItemsCount, setSavedItemsCount] = useState(0);
  const [followedEventsCount, setFollowedEventsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recentActivities, setRecentActivities] = useState<Array<{ 
    icon: any; 
    title: string; 
    date: string;
    iconColor: string;
  }>>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we need to navigate to a specific section from state or query params
  useEffect(() => {
    // Check URL query parameters first
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    
    if (tabParam) {
      // Map tab parameter to MenuSection
      const sectionMap: Record<string, MenuSection> = {
        'notifications': 'Notifications',
        
        'settings': 'Account Settings',
        'saved': 'Saved Items',
        'followers': 'Followers',
        'bookings': 'My Bookings'
      };
      
      const section = sectionMap[tabParam.toLowerCase()];
      if (section) {
        setActiveSection(section);
      }
    } else {
      // Fall back to location state
      const state = location.state as { activeSection?: MenuSection };
      if (state?.activeSection) {
        setActiveSection(state.activeSection);
        // Clear the state so it doesn't persist
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.search, location.state]);

  // Listen for team membership changes
  useEffect(() => {
    const handleTeamMembershipChange = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('teamMembershipChanged', handleTeamMembershipChange);
    return () => {
      window.removeEventListener('teamMembershipChanged', handleTeamMembershipChange);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const fetchUserData = async () => {
      try {
        // Add 10-second timeout for data fetching
        const fetchPromise = (async () => {
          if (!isMounted || !user) return;

          // Fetch all data in parallel for better performance
          const [
            roleResult,
            profileResult,
            charitableResult,
            brandResult,
            businessResult,
            savedResult,
            followedResult,
            unreadResult,
            followersResult,
            followingResult,
            teamMemberResult,
            recentPostsResult,
            recentLikesResult,
            recentCommentsResult
          ] = await Promise.all([
            supabase
              .from("user_roles")
              .select("account_type")
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("profiles")
              .select("display_name, username, avatar_url, first_name, last_name, email, telephone, bio, registration_number")
              .eq("id", user.id)
              .maybeSingle(),
            supabase
              .from("charitable_profiles")
              .select("organization_name, logo_url, avatar_url")
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("brand_profiles")
              .select("brand_name, logo_url, avatar_url")
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("business_profiles")
              .select("business_name, logo_url, avatar_url")
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("saved_posts")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id),
            supabase
              .from("followed_events")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id),
            supabase
              .from("notifications")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("read", false),
            supabase
              .from("user_follows")
              .select("*", { count: "exact", head: true })
              .eq("followed_id", user.id),
            supabase
              .from("user_follows")
              .select("*", { count: "exact", head: true })
              .eq("follower_id", user.id),
            supabase
              .from("team_members")
              .select("*", { count: "exact", head: true })
              .eq("member_id", user.id)
              .eq("status", "accepted"),
            supabase
              .from("posts")
              .select("id, created_at")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(5),
            supabase
              .from("post_likes")
              .select("created_at, post_id")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(5),
            supabase
              .from("post_comments")
              .select("created_at, post_id")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(5)
          ]);

          if (!isMounted) return;

          const metadataAccountType = user.user_metadata?.account_type as string | undefined;
          let userAccountType = roleResult.data?.account_type || metadataAccountType || "individual";

          // Fallback inference when user_roles is missing
          if (userAccountType === "individual") {
            if (businessResult.data?.business_name) {
              userAccountType = "business";
            } else if (brandResult.data?.brand_name) {
              userAccountType = "brand";
            } else if (charitableResult.data?.organization_name) {
              userAccountType = "charitable_partner";
            }
          }

          setAccountType(userAccountType);

          // Determine organization name and logo based on resolved account type
          const organizationName = userAccountType === "charitable_partner"
            ? charitableResult.data?.organization_name
            : userAccountType === "brand"
            ? brandResult.data?.brand_name
            : userAccountType === "business"
            ? businessResult.data?.business_name
            : null;

          const resolvedAvatar = userAccountType === "charitable_partner"
            ? (charitableResult.data?.logo_url || charitableResult.data?.avatar_url)
            : userAccountType === "brand"
            ? (brandResult.data?.logo_url || brandResult.data?.avatar_url)
            : userAccountType === "business"
            ? (businessResult.data?.logo_url || businessResult.data?.avatar_url)
            : null;

          const fallbackAvatar = charitableResult.data?.logo_url
            || charitableResult.data?.avatar_url
            || brandResult.data?.logo_url
            || brandResult.data?.avatar_url
            || businessResult.data?.logo_url
            || businessResult.data?.avatar_url
            || profileResult.data?.avatar_url
            || null;

          // Set all state at once
          setProfile({
            ...profileResult.data,
            organization_name: organizationName,
            avatar_url: resolvedAvatar || fallbackAvatar,
          });
          setSavedItemsCount(savedResult.count || 0);
          setFollowedEventsCount(followedResult.count || 0);
          setNotificationsCount(unreadResult.count || 0);
          setFollowersCount(followersResult.count || 0);
          setFollowingCount(followingResult.count || 0);
          setIsTeamMember((teamMemberResult.count || 0) > 0);
          
          // Build recent activities from posts, likes, and comments
          const activities: Array<{ 
            icon: any; 
            title: string; 
            date: string;
            iconColor: string;
            timestamp: Date;
          }> = [];
          
          // Add posts
          recentPostsResult.data?.forEach((post: any) => {
            activities.push({
              icon: FileText,
              title: "You created a new post",
              date: formatDate(post.created_at),
              iconColor: "text-foreground",
              timestamp: new Date(post.created_at)
            });
          });
          
          // Add likes
          recentLikesResult.data?.forEach((like: any) => {
            activities.push({
              icon: ThumbsUp,
              title: "You liked a post",
              date: formatDate(like.created_at),
              iconColor: "text-red-500",
              timestamp: new Date(like.created_at)
            });
          });
          
          // Add comments
          recentCommentsResult.data?.forEach((comment: any) => {
            activities.push({
              icon: MessageCircle,
              title: "You commented on a post",
              date: formatDate(comment.created_at),
              iconColor: "text-muted-foreground",
              timestamp: new Date(comment.created_at)
            });
          });
          
          // Sort by timestamp and take top 10
          activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setRecentActivities(activities.slice(0, 10));
          
          setLoading(false);
        })();

        // Race between fetch and timeout
        timeoutId = setTimeout(() => {
          if (isMounted && loading) {
            console.error("Account data fetch timeout");
            setLoading(false);
          }
        }, 10000);

        await fetchPromise;
        clearTimeout(timeoutId);
      } catch (error) {
        console.error("Error fetching account data:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, navigate, refreshTrigger]);

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse px-4">
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="w-16 h-16 sm:w-32 sm:h-32 rounded-full bg-muted" />
          <div className="space-y-3 flex-1">
            <div className="h-6 sm:h-8 w-32 sm:w-48 bg-muted rounded" />
            <div className="h-4 w-24 sm:w-32 bg-muted rounded" />
            <div className="h-4 w-28 sm:w-40 bg-muted rounded" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 sm:h-24 bg-muted rounded-lg" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 sm:h-24 bg-muted rounded-lg" />
          ))}
        </div>
        
        <div className="space-y-4">
          <div className="h-6 w-40 bg-muted rounded" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 sm:h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Use organization name for non-individual accounts, otherwise use first_name  
  const displayName = accountType !== "individual" && profile?.organization_name 
    ? profile.organization_name 
    : profile?.first_name || profile?.display_name || profile?.username || "User";
  const avatarInitial = (displayName || "U").charAt(0).toUpperCase();
  
  // Determine which menu items to show based on account type
  let menuItems = accountType === "individual" 
    ? individualMenuItems 
    : accountType === "charitable_partner"
    ? charitableMenuItems
    : accountType === "business"
    ? businessMenuItems
    : brandMenuItems;
  
  // Add Team Member section if user is part of any team
  if (isTeamMember && !menuItems.includes("Team Member")) {
    // Insert Team Member after Notifications for all account types
    const notificationsIndex = menuItems.indexOf("Notifications");
    if (notificationsIndex !== -1) {
      menuItems = [
        ...menuItems.slice(0, notificationsIndex + 1),
        "Team Member",
        ...menuItems.slice(notificationsIndex + 1),
      ];
    }
  }
  
  // Get the appropriate label for the information section
  const getInformationLabel = () => {
    if (accountType === "charitable_partner") return "Charity Information";
    if (accountType === "brand") return "Brand Information";
    if (accountType === "business") return "Business Information";
    return "Personal Information";
  };

  const handleMenuClick = (section: MenuSection) => {
    if (section === "Home") {
      navigate("/directory");
    } else {
      setActiveSection(section);
    }
  };

  const renderContent = () => {
    if (activeSection === "My Bookings") {
      // Customer bookings view
      return <MyBookingsPage viewType="customer" key="customer-bookings" />;
    }
    
    if (activeSection === "Bookings") {
      // Business bookings view
      return <MyBookingsPage viewType="business" key="business-bookings" />;
    }


    if (activeSection === "Personal Information" || activeSection === "Brand Information" || activeSection === "Business Information" || activeSection === "Charity Information") {
      return <PersonalInformationForm userId={user.id} profile={profile} accountType={accountType || "individual"} />;
    }

    if (activeSection === "Account Settings") {
      return <AccountSettings />;
    }

    if (activeSection === "Notifications") {
      return <NotificationsPage />;
    }

    if (activeSection === "Saved Items") {
      return <SavedItemsSection />;
    }

    if (activeSection === "Followers") {
      return <FollowersSection userId={user.id} />;
    }

    if (activeSection === "Business Management") {
      return <BusinessManagement />;
    }

    if (activeSection === "Team Member") {
      return <TeamMemberPage />;
    }

    if (activeSection === "Purchases & Subscriptions") {
      return <PurchasesSubscriptions />;
    }

    if (activeSection === "Overview") {
      return (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Account Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-foreground"></div>
                      <span className="text-sm font-medium text-foreground">Active</span>
                    </div>
                  </div>
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveSection("Saved Items")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Saved Items</p>
                    <p className="text-xl sm:text-2xl font-bold">{savedItemsCount}</p>
                  </div>
                  <Bookmark className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveSection("Notifications")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notifications</p>
                    <p className="text-xl sm:text-2xl font-bold">{notificationsCount}</p>
                  </div>
                  <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Media Stats */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Social Media</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveSection("Followers")}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Followers</p>
                      <p className="text-xl sm:text-2xl font-bold">{followersCount}</p>
                    </div>
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveSection("Followers")}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Following</p>
                      <p className="text-xl sm:text-2xl font-bold">{followingCount}</p>
                    </div>
                    <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Recent Activity</h2>
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/40 mb-4" />
                  <p className="font-medium text-base sm:text-lg mb-1">No recent activity yet</p>
                  <p className="text-sm text-muted-foreground">
                    Your activity will appear here as you use the platform
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {recentActivities.map((activity, index) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className={`p-2 sm:p-3 rounded-lg bg-background ${activity.iconColor}`}>
                          <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base">{activity.title}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{activity.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      );
    }

    // For other sections, show placeholder
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">{activeSection}</h2>
          <p className="text-muted-foreground">Content for this section is under development</p>
        </div>
      </div>
    );
  };

  // Sidebar content component for reuse
  const SidebarContent = ({ onMenuClick }: { onMenuClick?: () => void }) => (
    <div className="space-y-6">
      {/* User Profile */}
      <div className="flex items-center gap-3 pb-6 border-b">
        <Avatar className="w-12 h-12">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="bg-muted text-foreground">
            {avatarInitial}
          </AvatarFallback>
        </Avatar>
        <div>
          <p 
            className="font-semibold cursor-pointer hover:text-primary transition-colors"
            onClick={() => {
              navigate(`/profile/${user.id}`);
              onMenuClick?.();
            }}
          >
            {displayName}
          </p>
          <p className="text-sm text-muted-foreground">
            {accountType === 'charitable_partner' ? 'Charity Partner' : 
             accountType === 'brand' ? 'Brand' : 
             accountType === 'business' ? 'Business' : 
             `@${(displayName || 'user').toLowerCase().replace(/\s+/g, '')}`}
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const showSeparator = item === "Notifications";
          const displayLabel = (item === "Brand Information" || item === "Business Information" || item === "Charity Information") ? getInformationLabel() : item;
          
          return (
            <div key={item}>
              <button
                onClick={() => {
                  handleMenuClick(item);
                  onMenuClick?.();
                }}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeSection === item
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/50"
                }`}
              >
                {displayLabel}
              </button>
              {showSeparator && (
                <div className="my-2 border-b border-border"></div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Links */}
      <div className="pt-6 border-t space-y-2 text-sm text-muted-foreground">
        <div className="flex gap-3">
          <Link to="/help" className="hover:text-foreground" onClick={onMenuClick}>Help</Link>
          <Link to="/terms" className="hover:text-foreground" onClick={onMenuClick}>Terms</Link>
          <Link to="/privacy" className="hover:text-foreground" onClick={onMenuClick}>Privacy</Link>
        </div>
        <div className="flex gap-3">
          <Link to="/refund" className="hover:text-foreground" onClick={onMenuClick}>Refund</Link>
          <Link to="/community" className="hover:text-foreground" onClick={onMenuClick}>Community</Link>
          <Link to="/policy" className="hover:text-foreground" onClick={onMenuClick}>Policy</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 max-w-7xl mx-auto pt-0 px-0 sm:px-4 overflow-x-hidden">
      <div className="md:hidden flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Menu className="w-4 h-4" />
                <span>{activeSection}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                <span className="text-lg font-semibold">Account Menu</span>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="w-5 h-5" />
                  </Button>
                </SheetClose>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <SidebarContent onMenuClick={() => setMobileMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

      {/* Desktop Left Sidebar */}
      <div className="hidden md:block w-64 space-y-6 border-r pr-6 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-4 md:space-y-6 md:pl-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 font-playfair pt-4 md:pt-0">
          {activeSection === "Overview" ? "Account Overview" : 
           (activeSection === "Brand Information" || activeSection === "Business Information" || activeSection === "Charity Information") ? getInformationLabel() :
           activeSection}
        </h1>

        {renderContent()}
      </div>
    </div>
  );
}

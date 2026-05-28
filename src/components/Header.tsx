import { Search, LogOut, User as UserIcon, X, MessageSquare, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { MobileNav } from "@/components/MobileNav";
import logo from "@/assets/bellonecta-logo-white.png";
import logoIcon from "@/assets/bellonecta-icon.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";

export function Header() {
  const { user } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Use optimized hook for user profile
  const { data: profile } = useUserProfile(user?.id);

  const handleSignOut = async () => {
    // Clear ALL auth-related localStorage items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth')) {
        localStorage.removeItem(key);
      }
    });
    // Sign out globally to clear all sessions
    await supabase.auth.signOut({ scope: 'global' });
    navigate("/directory");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to discover page with search query
      navigate(`/discover?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-background text-foreground text-center text-[12px] md:text-[14px] font-medium leading-[18px] md:leading-[20px] py-1.5 border-b border-border font-playfair hidden md:block">
        Join free today — Low commission for beauty professionals
      </div>
      <header className="fixed top-0 md:top-[30px] left-0 right-0 h-14 bg-black text-white z-50 flex items-center justify-between px-4 md:px-6 py-1">
      <div className="flex items-center gap-2">
        <Link to="/explore-styles" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          {/* Icon only on mobile, full logo on larger screens */}
          <img 
            src={logoIcon} 
            alt="BelloNecta" 
            className="h-5 w-5 md:hidden" 
          />
          <img 
            src={logo} 
            alt="BelloNecta" 
            className="hidden md:block h-5 w-auto" 
          />
        </Link>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile: hamburger menu replaces search */}
        <MobileNav />

        {/* Desktop: search */}
        {showSearch ? (
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
            <Input
              type="text"
              placeholder="Search BelloNecta"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                setTimeout(() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }, 150);
              }}
              className="w-40 sm:w-64 md:w-[500px] h-9 bg-white border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 h-9 w-9"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-white hover:bg-white/10"
            onClick={() => setShowSearch(true)}
          >
            <Search className="w-5 h-5" />
          </Button>
        )}

        <Button 
          variant="ghost" 
          size="icon" 
          className="hidden md:flex text-white hover:bg-white/10"
          onClick={() => navigate("/cart")}
        >
          <ShoppingCart className="w-5 h-5" />
        </Button>
        
        
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none cursor-pointer">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-white text-black">
                      {(profile?.display_name || 'U')?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                <div className="px-3 py-3 border-b">
                  <button
                    onClick={() => user && navigate(`/professional/${user.id}`)}
                    className="font-semibold text-foreground hover:text-primary hover:underline transition-colors text-left w-full"
                  >
                    {profile?.display_name || 'User'}
                  </button>
                  <p className="text-sm text-muted-foreground">
                    {profile?.account_type === 'charitable_partner' ? 'Charity Partner' : 
                     profile?.account_type === 'brand' ? 'Brand' : 
                     profile?.account_type === 'business' ? 'Business' : 
                     'Individual'}
                  </p>
                </div>
                <DropdownMenuItem 
                  onClick={() => navigate("/account")} 
                  className="cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  My Account
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/help?tab=email")} 
                  className="cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Feedback
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link 
                to="/auth" 
                state={{ mode: "signin" }}
                className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-transparent border border-white/60 text-white">
                    <UserIcon className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Log In / Sign Up</span>
              </Link>
              <Button 
                asChild
                size="sm"
                className="bg-white text-black hover:bg-white/90 font-medium rounded-full px-5"
              >
                <Link to="/list-your-business">
                  List your business
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
    </>
  );
}

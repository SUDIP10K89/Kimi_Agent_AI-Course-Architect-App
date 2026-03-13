/**
 * Header Component
 * Glassmorphic floating nav with gradient logo and improved navigation
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Settings, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen = false }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-6">

          {/* Mobile Menu */}
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuToggle}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight group"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow duration-300">
              <GraduationCap className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="hidden sm:inline">
              <span className="text-primary">Course</span>
              <span className="text-foreground">X</span>
            </span>
          </Link>

          {/* Nav Links (Desktop, authenticated) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/courses">
                <Button
                  variant={location.pathname === '/courses' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 text-sm"
                >
                  <BookOpen className="h-4 w-4" />
                  My Courses
                </Button>
              </Link>
            </nav>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="hover:bg-accent">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-sm">Login</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="text-sm bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-sm hover:shadow-glow transition-all duration-300">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
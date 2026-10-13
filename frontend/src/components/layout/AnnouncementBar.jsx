import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const messages = [
  "Free Shipping on all orders over ₹2499!",
  "New Collection Drops Friday - Get Ready!",
  "Sign up for our newsletter for 10% off your first order",
  "Elevate your lifestyle with Luxeva exclusives",
  "Free Shipping on all orders over ₹2499!",
  "New Collection Drops Friday - Get Ready!",
  "Sign up for our newsletter for 10% off your first order",
  "Elevate your lifestyle with Luxeva exclusives",
];

const AnnouncementBar = () => {
  const { user } = useAuth();
  const ctaLink = user ? "/shop" : "/signup";
  const ctaText = user ? "Shop now" : "Join now";

  return (
    <div className="group relative flex overflow-hidden bg-[#151515] text-white/90 py-2.5 text-xs md:text-sm font-medium z-50 select-none dark:bg-[#1a1a1a] dark:text-white/85">
      {/* Primary marquee block */}
      <div className="flex animate-marquee whitespace-nowrap items-center shrink-0 min-w-full justify-around group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] will-change-transform">
        {messages.map((message, index) => (
          <span key={`a-${index}`} className="flex items-center mx-6 sm:mx-10 shrink-0">
            <Sparkles className="w-3.5 h-3.5 mr-2 opacity-70 text-amber-300 shrink-0" />
            <span>{message}</span>
            {index % 4 === 2 && (
              <Link
                to={ctaLink}
                className="underline underline-offset-4 ml-2 text-amber-300 hover:text-white transition-colors font-semibold"
              >
                {ctaText}
              </Link>
            )}
          </span>
        ))}
      </div>
      
      {/* Duplicate for seamless infinite loop */}
      <div
        className="flex animate-marquee whitespace-nowrap items-center shrink-0 min-w-full justify-around group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] will-change-transform"
        aria-hidden="true"
      >
        {messages.map((message, index) => (
          <span key={`b-${index}`} className="flex items-center mx-6 sm:mx-10 shrink-0">
            <Sparkles className="w-3.5 h-3.5 mr-2 opacity-70 text-amber-300 shrink-0" />
            <span>{message}</span>
            {index % 4 === 2 && (
              <Link
                to={ctaLink}
                tabIndex={-1}
                className="underline underline-offset-4 ml-2 text-amber-300 hover:text-white transition-colors font-semibold"
              >
                {ctaText}
              </Link>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;

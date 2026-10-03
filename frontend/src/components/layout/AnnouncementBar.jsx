import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

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
  return (
    <div className="relative flex overflow-hidden bg-ink text-sand py-2.5 text-xs md:text-sm font-medium z-50 dark:bg-sand dark:text-ink">
      {/* 
        We use two identical blocks. To make it seamless, they sit in a parent flex row. 
        Wait, a better seamless marquee in tailwind doesn't need absolute positioning if we just have a flex container that is wider than the screen.
      */}
      {/* Primary marquee block */}
      <div className="flex animate-marquee whitespace-nowrap items-center shrink-0 min-w-full justify-around hover:[animation-play-state:paused]">
        {messages.map((message, index) => (
          <span key={`a-${index}`} className="flex items-center mx-6 sm:mx-10">
            <Sparkles className="w-3.5 h-3.5 mr-2 opacity-70" />
            {message} 
            {index % 4 === 2 && (
              <Link to="/signup" className="underline underline-offset-4 ml-2 hover:text-white dark:hover:text-black transition-colors font-semibold">
                Join now
              </Link>
            )}
          </span>
        ))}
      </div>
      
      {/* Duplicate for seamless loop */}
      <div className="flex animate-marquee whitespace-nowrap items-center shrink-0 min-w-full justify-around hover:[animation-play-state:paused]" aria-hidden="true">
        {messages.map((message, index) => (
          <span key={`b-${index}`} className="flex items-center mx-6 sm:mx-10">
            <Sparkles className="w-3.5 h-3.5 mr-2 opacity-70" />
            {message}
            {index % 4 === 2 && (
              <Link to="/signup" className="underline underline-offset-4 ml-2 hover:text-white dark:hover:text-black transition-colors font-semibold">
                Join now
              </Link>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;

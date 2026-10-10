import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import AnnouncementBar from "./AnnouncementBar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import QuickViewModal from "../ui/QuickViewModal";

const variants = {
  initial: { opacity: 0, y: 15 },
  enter: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: -15, 
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } 
  },
};

const MainLayout = () => {
  const location = useLocation();
  
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="enter"
            exit="exit"
            variants={variants}
            className="flex flex-col min-h-screen"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <QuickViewModal />
    </>
  );
};

export default MainLayout;

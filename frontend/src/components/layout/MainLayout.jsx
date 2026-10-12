import { Outlet } from "react-router-dom";
import AnnouncementBar from "./AnnouncementBar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import QuickViewModal from "../ui/QuickViewModal";

const MainLayout = () => {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1 min-h-screen">
        <Outlet />
      </main>
      <Footer />
      <QuickViewModal />
    </>
  );
};

export default MainLayout;

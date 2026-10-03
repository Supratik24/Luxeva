import { Outlet } from "react-router-dom";
import AnnouncementBar from "./AnnouncementBar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import QuickViewModal from "../ui/QuickViewModal";

const MainLayout = () => (
  <>
    <AnnouncementBar />
    <Navbar />
    <main>
      <Outlet />
    </main>
    <Footer />
    <QuickViewModal />
  </>
);

export default MainLayout;


import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import QuickViewModal from "../ui/QuickViewModal";

const MainLayout = () => (
  <>
    <Navbar />
    <main>
      <Outlet />
    </main>
    <Footer />
    <QuickViewModal />
  </>
);

export default MainLayout;


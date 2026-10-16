import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./shared/Navbar";
import Footer from "./shared/footer";
import { useAuth } from "../context/AuthContext";

function Layout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default Layout;



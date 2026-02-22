import React from "react";
import "../css/Navbar.css";
import logo from "../assets/logo.jpg"; // your logo file

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="MiMR Analytics" className="logo" />
      </div>
      <div className="navbar-right">
        <a href="/signin" className="signin-link">About Us|SignIn</a>
      </div>
    </nav>
  );
};

export default Navbar;

import React from "react";
import "./css/NavBar.css";
import logo from "../assets/logo.png"; // your logo file

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="MiMR Analytics" className="logo" />
      </div>
      <div className="navbar-right">
        <a href="/signin" className="signin-link">SignIn/SignUp</a>
      </div>
    </nav>
  );
};

export default Navbar;

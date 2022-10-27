//The navbar.js and Navbar.css is from https://github.com/DevLHB/navbar-app
import React, { useState } from "react";
import "./Navbar.css";
import { Link } from "react-router-dom";


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="navbar" id = "AppNavbar">
         <span className="nav-logo">App name</span>
           <ul className="nav-links">
              <Link to="/">Home</Link>
              <Link to="/thresholding">Thresholding</Link>
              <Link to="/about">About</Link>


              
           </ul>
        </div>
  );
};

export default Navbar;
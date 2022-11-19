
/*
Title: navbar.js
Date: 2021-20-09
Author: Erno Hänninen
Description:
  - Contains the navbar for the app
*/
import React, { useState } from "react";
import "./Navbar.css";
import { Link } from "react-router-dom";


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="navbar" id = "AppNavbar">
         <span className="nav-logo">SIMPLIcity</span>
           <ul className="nav-links">
              <Link to="/">Home</Link>
              <Link to="/thresholding">Thresholding</Link>
              <Link to="/about">About</Link>


              
           </ul>
        </div>
  );
};

export default Navbar;

/*
Title: navbar.js
Date: 2021-20-09
Author: Erno Hänninen
Description:
  - Displays page not found if url which doesn't exists is submitted
*/

import React from "react";
import "./App.css";


export default function PageNotFound()  {

    return <div><br></br><b>{window.location.href} not found</b></div>;
}
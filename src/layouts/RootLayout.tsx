import React from 'react';
import {Outlet} from "react-router-dom";
import Header from "../components/Header.tsx";

const RootLayout = () => {
  return (
    <>
      <Header/>
      <Outlet/>
    </>
  );
};

export default RootLayout;
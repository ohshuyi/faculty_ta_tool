"use client"
import { useState } from "react";
import { Layout, Menu, Button } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import Link from "next/link";
import Image from 'next/image'
const { Header } = Layout;

const Navbar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const menuItems = [
    { label: <Link href="/">Home</Link>, key: "home" },
    { label: <Link href="/about">About</Link>, key: "about" },
    { label: <Link href="/services">Services</Link>, key: "services" },
    { label: <Link href="/contact">Contact</Link>, key: "contact" },
  ];
  return (
    <Image
    src="/next.svg"
    width={500}
    height={500}
    alt="Picture of the author"
  />
  )
  return (
    
    <Header className="header" style={{ position: "fixed", zIndex: 1, width: "100%" }}>
       <Image
      src="/next.svg"
      width={500}
      height={500}
      alt="Picture of the author"
    />
      <div className="logo" style={{ float: "left", display: "flex", alignItems: "center" }}>
        <Link href="/">
        <Image
      src="/next.svg"
      width={500}
      height={500}
      alt="Picture of the author"
    />
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <Button
        className="mobile-menu-button"
        type="primary"
        icon={<MenuOutlined />}
        onClick={toggleCollapsed}
        style={{ float: "right", marginTop: "15px", display: "none" }}
      />
      
      {/* Mobile and Desktop Menu */}
      <Menu
        theme="dark"
        mode={collapsed ? "vertical" : "horizontal"}
        defaultSelectedKeys={["home"]}
        items={menuItems}
        style={{ display: collapsed ? "block" : "inline-flex", marginLeft: "auto" }}
      />
    </Header>
  );
};

export default Navbar;

"use client"
import { useState } from "react";
import { Layout, Menu, Button } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import Link from "next/link";

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
    <Header className="header" style={{ position: "fixed", zIndex: 1, width: "100%" }}>
      <div className="logo" style={{ float: "left", color: "white", fontWeight: "bold", fontSize: "18px" }}>
        <Link href="/">BrandName</Link>
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

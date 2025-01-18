"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for navigation

export default function Home() {
  const [data, setData] = useState(null);
  const router = useRouter(); // Initialize the router

  useEffect(() => {
    // Redirect to /home immediately
    router.push("/home");

  }, [router]); // Include router in dependency array to avoid warnings

  return (
    <div>
      <h1>Redirecting...</h1>
    </div>
  );
}

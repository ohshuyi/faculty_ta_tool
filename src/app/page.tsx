"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 

export default function Home() {
  const [data, setData] = useState(null);
  const router = useRouter(); 

  useEffect(() => {
    router.push("/home");

  }, [router]); 

  return (
    <div>
      <h1>Redirecting...</h1>
    </div>
  );
}

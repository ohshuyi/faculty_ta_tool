"use client"
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data from the API
    const fetchData = async () => {
      try { // test
        const response = await fetch("/api/users");
        const result = await response.json();
        // Set the first result to state if it exists
        if (result.length > 0) {
          setData(result[0]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []); // Empty dependency array to run the effect once on mount

  return (
    <div>
      <h1>Hello</h1>
      {data ? (
        <div>
          {/* @ts-ignore */}
          <p>First User Name: {data.name}</p>
          {/* @ts-ignore */}
          <p>First User Email: {data.email}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

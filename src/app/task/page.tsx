"use client";
import React from "react";
import AppLayout from '@/components/Layout';
import TwoColumnsLayout from '@/components/TwoColumnsLayout';

const tasks = [
  { key: "1", title: "Task 1", description: "Details of Task 1" },
  { key: "2", title: "Task 2", description: "Details of Task 2" },
  { key: "3", title: "Task 3", description: "Details of Task 3" },
  // Add more tasks as needed
];

export default function TaskPage() {
  // Function to render the content dynamically based on the selected task key
  const renderTaskContent = (key: string) => {
    const task = tasks.find((task) => task.key === key);
    return (
      <>
        <h1>{task.title}</h1>
        <p>{task.description}</p>
      </>
    );
  };

  return (
    <AppLayout>
      <TwoColumnsLayout items={tasks} renderContent={renderTaskContent} />
    </AppLayout>
  );
}

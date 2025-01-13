"use client";
import React, { useState, useEffect } from "react";
import {
  Layout,
  Descriptions,
  Tag,
  List,
  Spin,
  Alert,
  Button,
  Modal,
  Form,
  message,
  Divider,
} from "antd";
import { FileOutlined } from "@ant-design/icons"; // For file icons
import { useSession } from "next-auth/react";
import AppLayout from "@/components/Layout";
import TwoColumnsLayout from "@/components/TwoColumnsLayout";
import AddTaskModal from "@/components/AddTaskModal"; // Modal for adding tasks
import TextArea from "antd/es/input/TextArea"; // Ant Design TextArea for comments
import { Task } from "@/lib/types"; // Assuming Task type is defined

// Function to get the status tag (for the task)
const getStatusTag = (status: string) => {
  return (
    <Tag color={status === "completed" ? "green" : "blue"}>
      {status.toUpperCase()}
    </Tag>
  );
};

// Main TaskPage component
export default function TaskPage() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  console.log("Tasks")
  console.log(tasks)
  // Fetch tasks from the API
  const fetchTasks = async (status = "open") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks?status=${status}`);
      const data = await response.json();

      if (data.length > 0) {
        setTasks(data);
        setSelectedTask(data[0]); // Default to the first task
      } else {
        setTasks([]);
        setSelectedTask(null);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setLoading(false);
    }
  };

  const fetchComments = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`);
      const data = await response.json();
      console.log("Fetched comments:", data); // Log the fetched comments
      setComments(data); // Set the state with the fetched comments
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Handle adding a comment
  const handleCommentSubmit = async () => {
    if (!newComment || !selectedTask) {
      message.warning("Please enter a comment and ensure a task is selected.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: session?.user?.name, // Ensure session is available
          content: newComment,
        }),
      });

      if (response.ok) {
        message.success("Comment added successfully.");
        setNewComment("");
        fetchComments(selectedTask.id); // Refresh comments
      } else {
        message.error("Failed to add comment.");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      message.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Close task (mark as completed)
  const handleCloseTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
      });

      if (response.ok) {
        message.success("Task marked as completed");
        setIsCloseModalVisible(false);
        fetchTasks(); // Refresh tasks after closing
      } else {
        message.error("Failed to close the task");
      }
    } catch (error) {
      console.error("Error closing the task:", error);
      message.error("An error occurred. Please try again.");
    }
  };

  // Show modal to add new task
  const showModal = () => {
    setIsModalVisible(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalVisible(false);
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [status]);

  // Fetch comments when selectedTask changes
  useEffect(() => {
    if (selectedTask?.id) {
      fetchComments(selectedTask.id);
    }
  }, [selectedTask]);

  const renderTaskDetails = (task: Task) => {
    return (
      <>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ fontWeight: "bold" }}>Task ID: {task.id}</h2>

          <Button
            type="primary"
            danger
            onClick={() => setIsCloseModalVisible(true)}
          >
            Close Task
          </Button>
        </div>
        <Descriptions bordered>
          <Descriptions.Item label="Course Code">
            {task.classes[0].courseCode}
          </Descriptions.Item>
          <Descriptions.Item label="Class Group">
            {task.classes[0].classGroup}
          </Descriptions.Item>
          <Descriptions.Item label="Due Date">
            {new Date(task.dueDate).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Details">{task.details}</Descriptions.Item>
          <Descriptions.Item label="Professor">
            {task.professor.name}
          </Descriptions.Item>
          <Descriptions.Item label="TA">{task.ta.name}</Descriptions.Item>
          <Descriptions.Item label="Status">
            {getStatusTag(task.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            {task.details}
          </Descriptions.Item>
        </Descriptions>

        <Divider />
        {/* Attached Files */}
        {task.files?.length > 0 && (
          <>
            <h3>Attached Files</h3>
            <List
              dataSource={task.files}
              renderItem={(file) => (
                <List.Item>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <Button type="link" icon={<FileOutlined />}>
                      {file.fileName}
                    </Button>
                  </a>
                </List.Item>
              )}
            />
          </>
        )}
        <Divider />
        {/* Comments Section */}
        <h3>Comments</h3>
        <List
          dataSource={comments}
          renderItem={(comment) => (
            <List.Item>
              <div>
                <strong>{comment.author}:</strong> {comment.content}
              </div>
            </List.Item>
          )}
        />
        <Divider />
        {/* Add Comment */}
        <h3>Add a Comment</h3>
        <Form onFinish={handleCommentSubmit}>
          <Form.Item>
            <TextArea
              rows={4}
              placeholder="Write your comment here..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Add Comment
            </Button>
          </Form.Item>
        </Form>

        {/* Modal to confirm closing the task */}
        <Modal
          title="Confirm Close Task"
          visible={isCloseModalVisible}
          onOk={() => handleCloseTask(task.id)}
          onCancel={() => setIsCloseModalVisible(false)}
          okText="Close Task"
          cancelText="Cancel"
        >
          <p>Are you sure you want to close this task?</p>
        </Modal>
      </>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <Spin size="large" />
      </AppLayout>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Alert
        message="You must be logged in to view tasks."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <AppLayout>
      <TwoColumnsLayout
        items={tasks.map((task) => ({
          key: task.id.toString(),
          title: task.name,
          tas: task.ta.id,
          courseCode: task?.classes[0].courseCode,
          
        }))}
        renderContent={(key) => {
          const task = tasks.find((task) => task.id.toString() === key);
          if (task) {
            setSelectedTask(task);
            return renderTaskDetails(task);
          }
        }}
        onAdd={showModal}
        type={"task"}
        userRole={session?.user?.role}
      />
      <AddTaskModal
        isVisible={isModalVisible}
        onClose={closeModal}
        onTaskAdded={fetchTasks}
      />
    </AppLayout>
  );
}

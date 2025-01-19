import React from "react";
import { Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";

const ClassUploader = ({ onUploadSuccess }) => {
  const handleFileUpload = async (info) => {
    const file = info.file;

    try {
      // Step 1: Read the file as binary
      const data = await file.arrayBuffer();

      // Step 2: Parse the Excel file
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0]; // Assuming the first sheet
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // Step 3: Validate the parsed data
      if (!jsonData.length) {
        message.error("The uploaded Excel file is empty.");
        return;
      }

      const classes = jsonData.map((row) => ({
        courseCode: row["Course Code"],
        courseName: row["Course Name"],
        groupCode: row["Group Code"],
        groupType: row["Group Type"],
      }));
    

      // Step 4: Send the parsed data to the backend
      const response = await fetch("/api/management", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classes }),
      });

      if (response.ok) {
        message.success("Classes uploaded successfully!");
        if (onUploadSuccess) onUploadSuccess();
      } else {
        const error = await response.json();
        message.error(`Failed to upload classes: ${error.message}`);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      message.error("Failed to process file. Please ensure it is a valid Excel file.");
    }
  };

  return (
    <div className="pb-2">

    <Upload 
      accept=".xlsx,.xls"
      beforeUpload={() => false} // Prevent automatic upload
      onChange={handleFileUpload}
      >
      <Button icon={<UploadOutlined />}>Upload Class Excel</Button>
    </Upload>
      </div>
  );
};

export default ClassUploader;

export interface Ticket {
    ticketNumber: string;
    ticketDescription: string;
    courseGroupType: string;
    category: string;
    student: string;
    details: string;
    professor: string;
    ta: string;
    priority: "low" | "medium" | "high";
    comments: { author: string, content: string }[];
  }
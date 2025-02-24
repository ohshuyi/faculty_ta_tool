export interface Ticket {
    status: string;
    files: any;
    id: number;
    ticketDescription: string;
    courseGroupType: string;
    category: string;
    student: string;
    details: string;
    professor: string;
    ta: string;
    name: string;
    priority: "low" | "medium" | "high";
    comments: { author: string, content: string }[];
  }
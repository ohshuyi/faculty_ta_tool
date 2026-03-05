"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

type CourseRole = "COURSE_COORDINATOR" | "TUTOR" | "TA";

interface UserCourseRole {
    courseCode: string;
    role: CourseRole;
}

interface CourseContextType {
    activeCourseCode: string | null;
    activeCourseRole: CourseRole | null;
    setActiveCourseCode: (courseCode: string) => void;
    availableCourses: UserCourseRole[];
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [activeCourseCode, setActiveCourseCode] = useState<string | null>(null);

    // Sort courses alphabetically for predictable UI ordering
    // @ts-ignore
    const availableCourses: UserCourseRole[] = Array.isArray(session?.user?.courseRoles)
        ? [...session.user.courseRoles].sort((a, b) => a.courseCode.localeCompare(b.courseCode))
        : [];

    // Automatically select the first course if no active course is selected yet
    useEffect(() => {
        if (status === "authenticated" && availableCourses.length > 0 && !activeCourseCode) {
            setActiveCourseCode(availableCourses[0].courseCode);
        }
    }, [status, availableCourses, activeCourseCode]);

    const activeCourseRole =
        availableCourses.find((c) => c.courseCode === activeCourseCode)?.role || null;

    return (
        <CourseContext.Provider
            value={{
                activeCourseCode,
                activeCourseRole,
                setActiveCourseCode,
                availableCourses,
            }}
        >
            {children}
        </CourseContext.Provider>
    );
}

export function useCourse() {
    const context = useContext(CourseContext);
    if (context === undefined) {
        throw new Error("useCourse must be used within a CourseProvider");
    }
    return context;
}

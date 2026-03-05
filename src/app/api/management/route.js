import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";


export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userRole = session.user.role;
    const userId = session.user.id;
    const courseRoles = session.user.courseRoles || [];

    // Extract courseCode from the request URL
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get('courseCode');

    console.log("DEBUG Management API:", { userId, userRole, courseCode, courseRolesCount: courseRoles.length });

    let classes;

    // Determine the active role for the requested course
    let activeRole = userRole; // Default to global
    if (courseCode) {
      const specificRoleRecord = courseRoles.find(cr => cr.courseCode === courseCode);
      if (specificRoleRecord) {
        activeRole = specificRoleRecord.role;
      } else if (userRole !== 'ADMIN') {
        console.log("DEBUG Management API: Unauthorized for course", courseCode);
        // If not an admin and no role for this course, they shouldn't see anything
        return new Response(JSON.stringify({ message: "Unauthorized for this course" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    console.log("DEBUG Management API: Determined activeRole", activeRole);

    if (!courseCode && userRole !== 'ADMIN') {
      // Intelligently fetch classes based on user's course roles
      const coordinatorCourses = courseRoles
        .filter(cr => cr.role === 'COURSE_COORDINATOR')
        .map(cr => cr.courseCode);

      const taCourses = courseRoles
        .filter(cr => cr.role === 'TA' || cr.role === 'TUTOR')
        .map(cr => cr.courseCode);

      const orConditions = [];
      if (coordinatorCourses.length > 0) {
        orConditions.push({ courseCode: { in: coordinatorCourses } });
      }
      if (taCourses.length > 0) {
        orConditions.push({
          courseCode: { in: taCourses },
          assignedTAs: { some: { id: userId } }
        });
      }

      if (orConditions.length > 0) {
        classes = await prisma.class.findMany({
          where: { OR: orConditions },
          include: { students: true },
        });
      } else {
        classes = [];
      }

      return new Response(JSON.stringify(classes), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (activeRole === 'TA' || activeRole === 'TUTOR') {
      classes = await prisma.class.findMany({
        where: {
          courseCode: courseCode, // Must be course specific
          assignedTAs: {
            some: {
              id: userId,
            },
          },
        },
        include: {
          students: true,
        },
      });
    } else {
      // Fetch all classes for PROFESSOR or COURSE_COORDINATOR (or ADMIN)
      classes = await prisma.class.findMany({
        where: {
          ...(courseCode ? { courseCode } : {}),
        },
        include: {
          students: true,
        },
      });
    }

    return new Response(JSON.stringify(classes), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return new Response(
      JSON.stringify({ message: "Failed to fetch classes", error: error.message }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    const classGroupsInFile = extractClassCourseGroups(rawData);

    if (classGroupsInFile.length === 0) {
      return NextResponse.json({ error: "No valid class groups found in file." }, { status: 400 });
    }

    const activeCourseCode = formData.get("activeCourseCode");
    const uploadScope = {
      courseCode: classGroupsInFile[0].courseCode,
      classType: classGroupsInFile[0].classType,
    };

    if (activeCourseCode && uploadScope.courseCode !== activeCourseCode) {
      return NextResponse.json({
        error: `Mismatched course codes: the uploaded file is for ${uploadScope.courseCode}, but your active course is ${activeCourseCode}.`
      }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Get all students and classes from the file
      const studentDataInFile = new Map(); // Use a Map for easy lookup
      classGroupsInFile.forEach(g => g.students.forEach(s => studentDataInFile.set(s.studentCode, s)));

      const classDataInFile = new Map(); // Map for class lookup
      classGroupsInFile.forEach(g => classDataInFile.set(g.classGroup, g));

      // 2. Upsert all students from the file
      const studentUpsertPromises = Array.from(studentDataInFile.values()).map(student =>
        tx.student.upsert({
          where: { studentCode: student.studentCode },
          update: { name: student.name, prog: student.prog },
          create: { name: student.name, studentCode: student.studentCode, prog: student.prog },
        })
      );
      await Promise.all(studentUpsertPromises);

      // 3. Get the database IDs of all students in the file
      const studentsInFileDb = await tx.student.findMany({
        where: { studentCode: { in: Array.from(studentDataInFile.keys()) } },
        select: { id: true, studentCode: true },
      });
      const studentCodeToIdMap = new Map(studentsInFileDb.map(s => [s.studentCode, s.id]));

      // 4. For each class in the file, upsert it and set its student roster exactly
      for (const group of classGroupsInFile) {
        const studentIdsToConnect = group.students.map(s => ({ id: studentCodeToIdMap.get(s.studentCode) }));

        await tx.class.upsert({
          where: {
            courseCode_classGroup_classType: {
              courseCode: group.courseCode,
              classGroup: group.classGroup,
              classType: group.classType,
            }
          },
          update: {
            classType: group.classType,
            students: { set: studentIdsToConnect },
          },
          create: {
            courseCode: group.courseCode,
            classGroup: group.classGroup,
            classType: group.classType,
            students: { connect: studentIdsToConnect },
          },
        });
      }

      // 5. SCOPED DELETION: Find and delete obsolete classes WITHIN THE SCOPE
      const classesInDbForScope = await tx.class.findMany({
        where: { courseCode: uploadScope.courseCode, classType: uploadScope.classType },
      });

      const classesToDelete = classesInDbForScope
        .filter(dbClass => !classDataInFile.has(dbClass.classGroup))
        .map(c => c.id);

      if (classesToDelete.length > 0) {
        await tx.class.deleteMany({ where: { id: { in: classesToDelete } } });
      }

      // 6. SCOPED DELETION: Find and delete obsolete students WITHIN THE SCOPE
      const studentsInDbForScope = await tx.student.findMany({
        where: {
          classes: { some: { courseCode: uploadScope.courseCode, classType: uploadScope.classType } },
        },
      });

      const studentsToDelete = studentsInDbForScope
        .filter(dbStudent => !studentDataInFile.has(dbStudent.studentCode))
        .map(s => s.id);

      if (studentsToDelete.length > 0) {
        await tx.student.deleteMany({ where: { id: { in: studentsToDelete } } });
      }

    }, { timeout: 30000 });

    return NextResponse.json({ message: `Sync for ${uploadScope.courseCode} (${uploadScope.classType}) successful.` }, { status: 200 });
  } catch (error) {
    console.error("Error processing Excel file:", error);
    return NextResponse.json({ message: "Error processing data", error: error.message }, { status: 500 });
  }
}

function extractClassCourseGroups(rawData) {
  // This metadata is for the entire file.
  const fileMetadata = {
    courseCode: rawData[2]?.[0]?.split(":")[1]?.trim().split(" ")[0] || "Unknown",
    classType: rawData[3]?.[0]?.split(":")[1]?.trim() || "Unknown",
  };

  const classGroups = [];
  let currentGroup = null;

  // Helper to save the group we've been building
  const saveCurrentGroup = () => {
    if (currentGroup && currentGroup.students.length > 0) {
      classGroups.push(currentGroup);
    }
  };

  for (const row of rawData) {
    if (row.length === 0 || row.every(cell => !cell)) continue; // Skip empty rows

    const isClassGroupHeader = row.some(
      (cell) => typeof cell === "string" && cell.includes("Class Group")
    );

    // Check if a row looks like a student entry (has a number and a student code)
    const isStudentRow = row.some((cell) => typeof cell === "number") && row[5];

    if (isClassGroupHeader) {
      // A new class group is starting. Save the previous one first.
      saveCurrentGroup();

      // Start the new group object
      const classGroupCell = row.find((cell) => typeof cell === "string" && cell.includes("Class Group"));
      currentGroup = {
        ...fileMetadata,
        classGroup: classGroupCell?.split(":")[1]?.trim() || "Unknown",
        students: [],
      };
    } else if (isStudentRow && currentGroup) {
      // This is a student row, add it to the current group being built
      currentGroup.students.push({
        studentCode: row[5],
        name: row[1],
        prog: row[2],
      });
    }
  }

  // After the loop finishes, make sure to save the very last group.
  saveCurrentGroup();

  return classGroups;
}


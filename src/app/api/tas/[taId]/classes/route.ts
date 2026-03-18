import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { taId: string } }) {
  try {
    const { taId } = params;

    if (!taId) {
      return NextResponse.json({ error: 'Missing taId' }, { status: 400 });
    }

    const taIdInt = parseInt(taId, 10);

    const ta = await prisma.user.findUnique({
      where: { id: taIdInt },
      include: {
        assignedClasses: true,
      },
    });

    if (!ta) {
      return NextResponse.json({ error: 'TA not found' }, { status: 404 });
    }

    return NextResponse.json(ta.assignedClasses);
  } catch (error) {
    console.error('Error fetching assigned classes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { taId: string } }) {
  try {
    const { taId } = params;
    const { classIds } = await req.json();

    if (!taId || !classIds) {
      return NextResponse.json({ error: 'Missing taId or classIds' }, { status: 400 });
    }

    const taIdInt = parseInt(taId, 10);

    await prisma.user.update({
      where: { id: taIdInt },
      data: {
        assignedClasses: {
          set: [],
        },
      },
    });

    const updatedTA = await prisma.user.update({
      where: { id: taIdInt },
      data: {
        assignedClasses: {
          connect: classIds.map((id: number) => ({ id })),
        },
      },
      include: {
        assignedClasses: true,
      },
    });

    return NextResponse.json(updatedTA);
  } catch (error) {
    console.error('Error assigning classes to TA:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
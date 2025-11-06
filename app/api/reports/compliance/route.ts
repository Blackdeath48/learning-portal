import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv").toLowerCase();

  const enrollments = await prisma.enrollment.findMany({
    include: {
      user: { select: { email: true, name: true } },
      course: { select: { title: true } }
    }
  });

  if (format === "pdf") {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    doc.fontSize(18).fillColor("#001BB7").text("Compliance Completion Report", { align: "left" });
    doc.moveDown();
    doc.fontSize(10).fillColor("#2C2C2C").text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    enrollments.forEach((enrollment) => {
      doc
        .fontSize(12)
        .fillColor("#0046FF")
        .text(enrollment.course.title, { continued: false });
      doc
        .fontSize(10)
        .fillColor("#2C2C2C")
        .text(`Learner: ${enrollment.user.name ?? enrollment.user.email}`);
      doc.text(`Email: ${enrollment.user.email}`);
      doc.text(`Progress: ${(enrollment.progress * 100).toFixed(0)}%`);
      doc.text(`Score: ${enrollment.score ? `${enrollment.score.toFixed(0)}%` : "N/A"}`);
      doc.text(`Completed: ${enrollment.completed ? "Yes" : "No"}`);
      doc.text(`Time Spent: ${enrollment.totalTimeMinutes} mins`);
      doc.moveDown();
    });

    doc.end();
    await new Promise<void>((resolve) => doc.on("end", resolve));
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=ethixlearn-compliance-${Date.now()}.pdf`
      }
    });
  }

  const headers = [
    "Learner Email",
    "Learner Name",
    "Course",
    "Progress",
    "Score",
    "Completed",
    "Time Spent (mins)"
  ];

  const rows = enrollments.map((enrollment) => [
    enrollment.user.email,
    enrollment.user.name ?? "",
    enrollment.course.title,
    `${Math.round(enrollment.progress * 100)}%`,
    enrollment.score ? `${Math.round(enrollment.score)}%` : "",
    enrollment.completed ? "Yes" : "No",
    String(enrollment.totalTimeMinutes)
  ]);

  const csv = [headers, ...rows].map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=ethixlearn-compliance-${Date.now()}.csv`
    }
  });
}

const PDFDocument = require("pdfkit");

const BRAND = process.env.PDF_BRAND_NAME || "Integriti";
const PRIMARY = "#1a56db";

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatHours = (value) => {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(2);
};

const formatLabel = (value) => {
  if (!value) return "—";
  return String(value)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const drawLogo = (doc) => {
  const x = 50;
  const y = doc.y;
  doc.roundedRect(x, y, 140, 36, 6).fill(PRIMARY);
  doc
    .fillColor("#ffffff")
    .fontSize(16)
    .font("Helvetica-Bold")
    .text(BRAND, x, y + 10, { width: 140, align: "center" });
  doc.fillColor("#111827");
  doc.y = y + 48;
};

const writeHeader = (doc, title, startDate, endDate) => {
  drawLogo(doc);
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#111827").text(title);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#6b7280")
    .text(`Report period: ${formatDate(startDate)} — ${formatDate(endDate)}`);
  doc.moveDown(1);
  doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);
};

const ensureSpace = (doc, height = 60) => {
  if (doc.y + height > 740) {
    doc.addPage();
  }
};

const writeTable = (doc, headers, rows, options = {}) => {
  const startX = 50;
  const tableWidth = 495;
  const fontSize = options.fontSize || 8;
  const colWidth = tableWidth / headers.length;

  ensureSpace(doc, 30);
  const headerY = doc.y;
  doc.font("Helvetica-Bold").fontSize(fontSize).fillColor("#111827");
  headers.forEach((header, i) => {
    doc.text(header, startX + i * colWidth, headerY, {
      width: colWidth - 4,
      lineBreak: false,
    });
  });
  doc.moveDown(0.6);

  rows.forEach((row) => {
    ensureSpace(doc, 20);
    const rowY = doc.y;
    doc.font("Helvetica").fontSize(fontSize).fillColor("#374151");
    row.forEach((cell, i) => {
      const text = String(cell ?? "—").slice(0, options.truncate || 40);
      doc.text(text, startX + i * colWidth, rowY, {
        width: colWidth - 4,
        lineBreak: false,
      });
    });
    doc.y = rowY + 14;
  });
  doc.moveDown(0.8);
};

const generateTeamPdf = (reportData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const memberName = reportData.member?.full_name;
    writeHeader(
      doc,
      memberName ? `Team Performance Report — ${memberName}` : "Team Performance Report",
      reportData.startDate,
      reportData.endDate
    );

    doc.font("Helvetica-Bold").fontSize(12).text("Development Performance Summary");
    doc.moveDown(0.5);

    const developers = reportData.developers || [];
    writeTable(
      doc,
      [
        "Developer",
        "Time Logged",
        "Projects",
        "Assigned",
        "Completed",
        "Variance",
        "Efficiency %",
        "Team Rating",
      ],
      developers.map((d) => [
        d.full_name,
        formatHours(d.total_time_logged || d.total_actual),
        d.projects_worked_on,
        d.total_tasks,
        d.completed_tasks,
        formatHours(d.variance),
        formatHours(d.efficiency_rate),
        d.matrix_rating,
      ]),
      { fontSize: 7 }
    );

    developers.forEach((developer) => {
      if (!developer.tasks?.length) return;

      ensureSpace(doc, 80);
      doc.addPage();
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(PRIMARY)
        .text(developer.full_name);
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#6b7280")
        .text(developer.title || "");
      doc.moveDown(0.8);

      writeTable(
        doc,
        [
          "Task",
          "Project",
          "Start",
          "End",
          "Est.",
          "Actual",
          "Variance",
          "Efficiency",
          "Status",
        ],
        developer.tasks.map((t) => [
          t.name,
          t.project_name,
          formatDateTime(t.start_time),
          formatDateTime(t.completed_at || t.deadline),
          formatHours(t.estimated_hours),
          formatHours(t.actual_hours),
          formatHours(t.variance),
          formatHours(t.efficiency_rate),
          formatLabel(t.status),
        ]),
        { fontSize: 7, truncate: 28 }
      );
    });

    doc
      .fontSize(8)
      .fillColor("#9ca3af")
      .text(`Generated by ${BRAND} Employee Management System`, 50, 780, {
        align: "center",
        width: 495,
      });

    doc.end();
  });
};

const generateProjectPdf = (reportData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const projectName = reportData.project?.name;
    writeHeader(
      doc,
      projectName ? `Project Report — ${projectName}` : "Project Performance Report",
      reportData.startDate,
      reportData.endDate
    );

    const projects = reportData.projects || [];

    if (projects.length > 0) {
      doc.font("Helvetica-Bold").fontSize(12).text("Project Performance Summary");
      doc.moveDown(0.5);
      writeTable(
        doc,
        [
          "Project",
          "Lead",
          "Status",
          "Quality",
          "Tasks",
          "Completed",
          "Est.",
          "Actual",
          "Variance",
          "Efficiency %",
        ],
        projects.map((p) => [
          p.name,
          p.lead_developer_name,
          formatLabel(p.status),
          formatLabel(p.quality),
          p.total_tasks,
          p.completed_tasks,
          formatHours(p.total_estimated),
          formatHours(p.total_actual),
          formatHours(p.variance),
          formatHours(p.efficiency_rate),
        ]),
        { fontSize: 7 }
      );
    }

    projects.forEach((project) => {
      ensureSpace(doc, 60);
      doc.font("Helvetica-Bold").fontSize(13).fillColor(PRIMARY).text(project.name);
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#6b7280")
        .text(
          `Lead: ${project.lead_developer_name || "—"} · Status: ${formatLabel(project.status)} · Quality: ${formatLabel(project.quality)}`
        );
      doc.moveDown(0.6);

      const tasks = project.tasks || reportData.tasks || [];
      if (!tasks.length) {
        doc.fontSize(10).fillColor("#6b7280").text("No tasks in selected period.");
        doc.moveDown(1);
        return;
      }

      writeTable(
        doc,
        [
          "Task",
          "Assignee",
          "Complexity",
          "Priority",
          "Start",
          "End",
          "Est.",
          "Actual",
          "Variance",
          "Status",
        ],
        tasks.map((t) => [
          t.name,
          t.assigned_to_name,
          formatLabel(t.complexity),
          formatLabel(t.priority),
          formatDateTime(t.start_time),
          formatDateTime(t.completed_at || t.deadline),
          formatHours(t.estimated_hours),
          formatHours(t.actual_hours),
          formatHours(t.variance),
          formatLabel(t.status),
        ]),
        { fontSize: 7, truncate: 24 }
      );
      doc.moveDown(1);
    });

    doc
      .fontSize(8)
      .fillColor("#9ca3af")
      .text(`Generated by ${BRAND} Employee Management System`, 50, 780, {
        align: "center",
        width: 495,
      });

    doc.end();
  });
};

module.exports = {
  generateTeamPdf,
  generateProjectPdf,
};

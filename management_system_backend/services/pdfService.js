const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const BRAND = process.env.PDF_BRAND_NAME || "Integriti";
const PRIMARY = "#0f766e"; // Integriti teal used in UI
const PRIMARY_DARK = "#115e59";
const ACCENT = "#1a56db";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const HEADER_BG = "#0f766e";
const ROW_ALT = "#f8fafc";
const CARD_BG = "#f0fdfa";

const LOGO_PATH = path.join(__dirname, "../assets/logo.png");

const CHART_COLORS = [
  "#0f766e",
  "#1a56db",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#059669",
  "#0891b2",
  "#db2777",
];

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
  if (value === null || value === undefined || value === "") return "—";
  return Number(value).toFixed(2);
};

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toFixed(1)}%`;
};

const formatLabel = (value) => {
  if (!value) return "—";
  return String(value)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/** "high output / medium quality" → "High Output / Medium Quality" */
const formatMatrixRating = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value)
    .split("/")
    .map((part) =>
      part
        .trim()
        .split(/[\s_]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
    )
    .join(" / ");
};

const formatEndTime = (task) =>
  formatDateTime(task.completed_at || task.deadline || task.end_time);

const pageWidth = (doc) => doc.page.width - doc.page.margins.left - doc.page.margins.right;
const contentLeft = (doc) => doc.page.margins.left;

const ensureSpace = (doc, height = 60) => {
  const bottom = doc.page.height - doc.page.margins.bottom - 20;
  if (doc.y + height > bottom) {
    doc.addPage();
    drawPageChrome(doc);
  }
};

const drawPageChrome = (doc) => {
  // Top accent bar on each page
  doc.save();
  doc.rect(0, 0, doc.page.width, 6).fill(PRIMARY);
  doc.restore();
  if (doc.y < 40) doc.y = 40;
};

const drawLogo = (doc) => {
  const x = contentLeft(doc);
  const y = doc.y;
  const hasLogo = fs.existsSync(LOGO_PATH);

  if (hasLogo) {
    try {
      // Same cube/hex mark as the sidebar, scaled for print
      doc.image(LOGO_PATH, x, y, { width: 40, height: 40 });
      doc
        .fillColor(TEXT)
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(BRAND, x + 50, y + 6);
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(8)
        .text("Employee Management System", x + 50, y + 24);
      doc.y = y + 56;
      return;
    } catch {
      // fall through
    }
  }

  doc.roundedRect(x, y, 42, 42, 8).fill(PRIMARY);
  doc
    .fillColor("#ffffff")
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("I", x, y + 11, { width: 42, align: "center" });
  doc
    .fillColor(TEXT)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(BRAND, x + 52, y + 6);
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(8)
    .text("Employee Management System", x + 52, y + 24);
  doc.y = y + 56;
};

const writeHeader = (doc, title, startDate, endDate) => {
  drawPageChrome(doc);
  drawLogo(doc);

  // Title banner
  const left = contentLeft(doc);
  const width = pageWidth(doc);
  const bannerY = doc.y;
  doc.roundedRect(left, bannerY, width, 46, 8).fill(HEADER_BG);
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(title, left + 14, bannerY + 10, { width: width - 28 });
  doc
    .fillColor("#ccfbf1")
    .font("Helvetica")
    .fontSize(9)
    .text(
      `Report period: ${formatDate(startDate)} — ${formatDate(endDate)}`,
      left + 14,
      bannerY + 28,
      { width: width - 28 }
    );
  doc.y = bannerY + 60;
};

const writeSectionTitle = (doc, title) => {
  ensureSpace(doc, 36);
  const left = contentLeft(doc);
  const y = doc.y;
  doc.roundedRect(left, y, 4, 16, 2).fill(PRIMARY);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(PRIMARY_DARK)
    .text(title, left + 12, y + 1);
  doc.y = y + 22;
};

const writeSummaryGrid = (doc, items) => {
  const left = contentLeft(doc);
  const width = pageWidth(doc);
  const cols = 5;
  const gap = 8;
  const boxW = (width - gap * (cols - 1)) / cols;
  const boxH = 58;
  let rowY = doc.y;

  items.forEach((item, index) => {
    const col = index % cols;
    if (col === 0) {
      ensureSpace(doc, boxH + 12);
      rowY = doc.y;
    }
    const x = left + col * (boxW + gap);
    const raw = String(item.value ?? "—");
    // Keep long ratings (e.g. "High Output / Medium Quality") inside the card
    const isMatrix = /\//.test(raw) && /output|quality/i.test(raw);
    const value = isMatrix ? raw.replace(/\s*\/\s*/g, "\n") : raw;
    const valueSize = isMatrix
      ? 9
      : value.length > 22
        ? 8
        : value.length > 12
          ? 9.5
          : 11;

    doc.roundedRect(x, rowY, boxW, boxH, 6).fill(CARD_BG);
    doc.roundedRect(x, rowY, boxW, boxH, 6).strokeColor("#99f6e4").lineWidth(0.8).stroke();
    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(MUTED)
      .text(String(item.label).toUpperCase(), x + 7, rowY + 6, {
        width: boxW - 14,
        height: 12,
        lineBreak: false,
        ellipsis: true,
      });
    doc
      .font("Helvetica-Bold")
      .fontSize(valueSize)
      .fillColor(TEXT)
      .text(value, x + 7, rowY + 20, {
        width: boxW - 14,
        height: boxH - 26,
        align: "left",
        lineGap: isMatrix ? 1 : 0,
      });

    if (col === cols - 1 || index === items.length - 1) {
      doc.y = rowY + boxH + 12;
    }
  });
};

const writeTable = (doc, headers, rows, widths, options = {}) => {
  const left = contentLeft(doc);
  const fontSize = options.fontSize || 7;
  const rowH = options.rowH || 16;
  const truncate = options.truncate || 42;
  const tableW = widths.reduce((a, b) => a + b, 0);

  ensureSpace(doc, rowH + 8);

  // Header bar
  let x = left;
  const headerY = doc.y;
  doc.roundedRect(left, headerY, tableW, rowH, 3).fill(PRIMARY);
  doc.font("Helvetica-Bold").fontSize(fontSize).fillColor("#ffffff");
  headers.forEach((header, i) => {
    doc.text(header, x + 3, headerY + 4, {
      width: widths[i] - 6,
      lineBreak: false,
    });
    x += widths[i];
  });
  doc.y = headerY + rowH;

  rows.forEach((row, rowIndex) => {
    ensureSpace(doc, rowH + 2);
    const rowY = doc.y;
    if (rowIndex % 2 === 1) {
      doc.rect(left, rowY, tableW, rowH).fill(ROW_ALT);
    }
    x = left;
    doc.font("Helvetica").fontSize(fontSize).fillColor("#334155");
    row.forEach((cell, i) => {
      const text = String(cell ?? "—").slice(0, truncate);
      doc.text(text, x + 3, rowY + 4, {
        width: widths[i] - 6,
        lineBreak: false,
      });
      x += widths[i];
    });
    doc.y = rowY + rowH;
  });

  doc
    .strokeColor(LINE)
    .lineWidth(0.6)
    .rect(left, headerY, tableW, doc.y - headerY)
    .stroke();
  doc.moveDown(0.7);
};

const writeFooter = (doc) => {
  // Writing into the bottom margin with default lineBreak can spawn blank pages.
  const prevBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#94a3b8")
    .text(
      `Generated by ${BRAND} Employee Management System  ·  Confidential`,
      contentLeft(doc),
      doc.page.height - 20,
      {
        align: "center",
        width: pageWidth(doc),
        lineBreak: false,
        height: 12,
      }
    );
  doc.page.margins.bottom = prevBottom;
};

const drawChartTitle = (doc, title, x, y, width) => {
  doc.roundedRect(x, y, 3, 11, 1).fill(PRIMARY);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(PRIMARY_DARK)
    .text(title, x + 7, y + 1, {
      width: width - 10,
      height: 12,
      lineBreak: false,
      ellipsis: true,
    });
};

/** Vertical bar chart inside a fixed box (for multi-column layout) */
const drawBarChartInBox = (doc, title, data, valueKey, box) => {
  const { x: left, y: top, width } = box;
  drawChartTitle(doc, title, left, top, width);

  const chartH = 92;
  const chartTop = top + 18;
  const chartBottom = chartTop + chartH;
  const items = data.slice(0, 8);
  const maxVal = Math.max(...items.map((d) => Number(d[valueKey] || 0)), 1);
  const barGap = 4;
  const barW = Math.max(8, Math.min(26, (width - 12) / items.length - barGap));
  const barsStart = left + 4;
  const barsEnd = barsStart + items.length * (barW + barGap) - barGap;
  // Axis only under the bars — avoid a full-width grey line across the chart slot
  const axisPad = 6;
  doc
    .strokeColor(LINE)
    .lineWidth(0.8)
    .moveTo(Math.max(left, barsStart - axisPad), chartBottom)
    .lineTo(Math.min(left + width, barsEnd + axisPad), chartBottom)
    .stroke();

  items.forEach((item, i) => {
    const val = Number(item[valueKey] || 0);
    const h = (val / maxVal) * (chartH - 16);
    const x = barsStart + i * (barW + barGap);
    const y = chartBottom - h;
    doc.roundedRect(x, y, barW, Math.max(h, 0.5), 2).fill(CHART_COLORS[i % CHART_COLORS.length]);
    doc
      .font("Helvetica-Bold")
      .fontSize(6)
      .fillColor(TEXT)
      .text(String(val), x - 2, y - 9, {
        width: barW + 4,
        align: "center",
        lineBreak: false,
      });
    doc
      .font("Helvetica")
      .fontSize(5.5)
      .fillColor(MUTED)
      .text(String(item.name || "").slice(0, 10), x - 4, chartBottom + 3, {
        width: barW + 8,
        align: "center",
        lineBreak: false,
      });
  });
};

/** Grouped estimated vs actual bars inside a fixed box */
const drawGroupedBarInBox = (doc, title, data, box) => {
  const { x: left, y: top, width } = box;
  drawChartTitle(doc, title, left, top, width);

  const chartH = 84;
  const chartTop = top + 18;
  const chartBottom = chartTop + chartH;
  const items = data.slice(0, 6);
  const maxVal = Math.max(
    ...items.flatMap((d) => [Number(d.estimated || 0), Number(d.actual || 0)]),
    1
  );
  const groupW = Math.max(18, Math.min(48, (width - 8) / items.length));
  const barW = Math.max(4, (groupW - 4) / 2);
  const groupsStart = left + 4;
  const groupsEnd = groupsStart + items.length * groupW - 4;
  const axisPad = 6;
  doc
    .strokeColor(LINE)
    .lineWidth(0.8)
    .moveTo(Math.max(left, groupsStart - axisPad), chartBottom)
    .lineTo(Math.min(left + width, groupsEnd + axisPad), chartBottom)
    .stroke();

  items.forEach((item, i) => {
    const gx = groupsStart + i * groupW;
    const est = Number(item.estimated || 0);
    const act = Number(item.actual || 0);
    const estH = (est / maxVal) * (chartH - 14);
    const actH = (act / maxVal) * (chartH - 14);
    doc.roundedRect(gx, chartBottom - estH, barW, Math.max(estH, 0.5), 2).fill(ACCENT);
    doc
      .roundedRect(gx + barW + 2, chartBottom - actH, barW, Math.max(actH, 0.5), 2)
      .fill("#ea580c");
    doc
      .font("Helvetica")
      .fontSize(5.5)
      .fillColor(MUTED)
      .text(String(item.name || "").slice(0, 9), gx - 2, chartBottom + 3, {
        width: groupW,
        align: "center",
        lineBreak: false,
      });
  });

  const legendY = chartBottom + 16;
  doc.roundedRect(left, legendY, 7, 7, 1).fill(ACCENT);
  doc.fontSize(6).fillColor(TEXT).text("Est.", left + 10, legendY, { lineBreak: false });
  doc.roundedRect(left + 36, legendY, 7, 7, 1).fill("#ea580c");
  doc.text("Act.", left + 46, legendY, { lineBreak: false });
};

/** Donut / pie chart inside a fixed box */
const drawPieInBox = (doc, title, data, box) => {
  const { x: left, y: top, width, height } = box;
  drawChartTitle(doc, title, left, top, width);

  const total = data.reduce((s, d) => s + Number(d.value || 0), 0) || 1;
  const r = Math.min(34, Math.max(22, width * 0.16));
  const cx = left + r + 8;
  const cy = top + 18 + r + 6;
  let angle = -Math.PI / 2;

  data.forEach((item, i) => {
    const slice = (Number(item.value || 0) / total) * Math.PI * 2;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    const steps = Math.max(8, Math.ceil(slice * 12));
    doc.save();
    doc.moveTo(cx, cy);
    for (let s = 0; s <= steps; s += 1) {
      const a = angle + (slice * s) / steps;
      doc.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    doc.closePath();
    doc.fill(color);
    doc.restore();
    angle += slice;
  });

  doc.circle(cx, cy, Math.max(10, r * 0.45)).fill("#ffffff");
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(TEXT)
    .text(String(total), cx - 14, cy - 5, { width: 28, align: "center", lineBreak: false });

  let ly = top + 20;
  const lx = cx + r + 12;
  const legendW = Math.max(40, left + width - lx);
  data.forEach((item, i) => {
    if (ly > top + height - 10) return;
    const pct = Math.round((Number(item.value || 0) / total) * 100);
    doc.roundedRect(lx, ly, 7, 7, 1).fill(CHART_COLORS[i % CHART_COLORS.length]);
    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(TEXT)
      .text(`${formatLabel(item.name)} ${item.value} (${pct}%)`, lx + 11, ly, {
        width: legendW - 4,
        height: 10,
        lineBreak: false,
        ellipsis: true,
      });
    ly += 12;
  });
};

const CHART_SLOT_H = 150;

const writeChartsSection = (doc, charts = {}) => {
  if (!charts || !Object.keys(charts).length) return;

  const slots = [];
  if (charts.tasksCompletedBar?.length) {
    slots.push({
      key: "completion",
      draw: (d, box) =>
        drawBarChartInBox(d, "Task Completion by Developer", charts.tasksCompletedBar, "value", box),
    });
  }
  if (charts.estimatedVsActual?.length) {
    slots.push({
      key: "estVsActual",
      draw: (d, box) =>
        drawGroupedBarInBox(d, "Estimated vs Actual Time", charts.estimatedVsActual, box),
    });
  }
  if (charts.statusPie?.length) {
    slots.push({
      key: "status",
      draw: (d, box) =>
        drawPieInBox(d, "Task Status Distribution", charts.statusPie, box),
    });
  }
  if (charts.complexityBreakdown?.length) {
    slots.push({
      key: "complexity",
      draw: (d, box) =>
        drawPieInBox(d, "Task Complexity Breakdown", charts.complexityBreakdown, box),
    });
  }

  if (!slots.length) return;

  ensureSpace(doc, 36);
  writeSectionTitle(doc, "Visual Analytics");

  // 2 charts/row when 2 or 4; 3 when exactly 3 — fills the page, no empty columns
  const cols = slots.length === 3 ? 3 : Math.min(2, slots.length);
  const left = contentLeft(doc);
  const fullW = pageWidth(doc);
  const gap = 14;
  const colW = (fullW - gap * (cols - 1)) / cols;
  let rowY = doc.y;

  slots.forEach((slot, index) => {
    const col = index % cols;
    if (col === 0) {
      ensureSpace(doc, CHART_SLOT_H + 8);
      rowY = doc.y;
    }
    const x = left + col * (colW + gap);
    slot.draw(doc, {
      x,
      y: rowY,
      width: colW,
      height: CHART_SLOT_H,
    });
    if (col === cols - 1 || index === slots.length - 1) {
      doc.y = rowY + CHART_SLOT_H + 8;
    }
  });
};

const generateTeamPdf = (reportData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
      bufferPages: true,
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const memberName = reportData.member?.full_name;
    writeHeader(
      doc,
      memberName
        ? `Team Performance Report — ${memberName}`
        : "Team Performance Report",
      reportData.startDate,
      reportData.endDate
    );

    writeSectionTitle(doc, "Summary");
    const summary = reportData.summary || {};
    writeSummaryGrid(doc, [
      { label: "Total Tasks", value: summary.total_tasks ?? 0 },
      { label: "Completed Tasks", value: summary.completed_tasks ?? 0 },
      { label: "Active Tasks", value: summary.active_tasks ?? 0 },
      { label: "On Hold", value: summary.on_hold_tasks ?? 0 },
      {
        label: "Total Time Logged",
        value: formatHours(summary.total_time_logged ?? summary.total_actual),
      },
      { label: "Estimated Time", value: formatHours(summary.total_estimated) },
      { label: "Actual Time", value: formatHours(summary.total_actual) },
      { label: "Variance", value: formatHours(summary.variance) },
      { label: "Efficiency Rate", value: formatPercent(summary.efficiency_rate) },
      {
        label: "Team Matrix Rating",
        value: formatMatrixRating(
          summary.matrix_rating || reportData.member?.matrix_rating
        ),
      },
    ]);

    writeSectionTitle(doc, "Development Performance Summary");
    const developers = reportData.developers || [];
    writeTable(
      doc,
      [
        "Developer Name",
        "Total Time Logged",
        "Projects Worked On",
        "Tasks Assigned",
        "Tasks Completed",
        "Variance",
        "Efficiency Rate",
        "Team Rating",
      ],
      developers.map((d) => [
        d.full_name,
        formatHours(d.total_time_logged || d.total_actual),
        d.projects_worked_on,
        d.total_tasks,
        d.completed_tasks,
        formatHours(d.variance),
        formatPercent(d.efficiency_rate),
        formatMatrixRating(d.matrix_rating),
      ]),
      [115, 85, 85, 75, 75, 65, 80, 130],
      { fontSize: 7, truncate: 48 }
    );

    writeChartsSection(doc, reportData.charts);

    const devTaskWidths = [105, 95, 90, 90, 70, 65, 58, 75, 60];
    const devTaskTableW = devTaskWidths.reduce((a, b) => a + b, 0);

    developers.forEach((developer) => {
      if (!developer.tasks?.length) return;

      ensureSpace(doc, 90);
      const y = doc.y;
      const left = contentLeft(doc);
      // Name bar must match the task table width (not full page)
      doc.roundedRect(left, y, devTaskTableW, 28, 6).fill("#ecfdf5");
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(PRIMARY_DARK)
        .text(developer.full_name, left + 12, y + 8, {
          width: devTaskTableW - 24,
          lineBreak: false,
          ellipsis: true,
        });
      doc.y = y + 36;

      if (developer.title) {
        doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(developer.title, {
          width: devTaskTableW,
        });
      }
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(MUTED)
        .text(
          `Matrix: ${formatMatrixRating(developer.matrix_rating)}  ·  Efficiency: ${formatPercent(developer.efficiency_rate)}`,
          { width: devTaskTableW }
        );
      doc.moveDown(0.5);

      writeTable(
        doc,
        [
          "Task Assigned",
          "Project Name",
          "Start Time",
          "End Time",
          "Estimated Time",
          "Actual Time",
          "Variance",
          "Efficiency Rate",
          "Status",
        ],
        developer.tasks.map((t) => [
          t.name,
          t.project_name,
          formatDateTime(t.start_time),
          formatEndTime(t),
          formatHours(t.estimated_hours),
          formatHours(t.actual_hours),
          formatHours(t.variance),
          formatPercent(t.efficiency_rate),
          formatLabel(t.status),
        ]),
        devTaskWidths,
        { fontSize: 6.5, truncate: 34 }
      );
    });

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i += 1) {
      doc.switchToPage(i);
      writeFooter(doc);
    }

    doc.end();
  });
};

const generateProjectPdf = (reportData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 36,
      size: "A4",
      layout: "landscape",
      bufferPages: true,
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const projectName = reportData.project?.name;
    writeHeader(
      doc,
      projectName
        ? `Project Performance Report — ${projectName}`
        : "Project Performance Report",
      reportData.startDate,
      reportData.endDate
    );

    const projects = reportData.projects || [];
    const summary = reportData.summary || {};

    writeSectionTitle(doc, "Project Summary");
    writeSummaryGrid(doc, [
      { label: "Total Projects", value: summary.total_projects ?? projects.length },
      { label: "Active Projects", value: summary.active_projects ?? "—" },
      { label: "Completed Projects", value: summary.completed_projects ?? "—" },
      { label: "Projects on Hold", value: summary.on_hold_projects ?? "—" },
      { label: "Total Tasks", value: summary.total_tasks ?? 0 },
      { label: "Completed Tasks", value: summary.completed_tasks ?? 0 },
      { label: "Active Tasks", value: summary.active_tasks ?? 0 },
      {
        label: "Total Estimated Time",
        value: formatHours(summary.total_estimated),
      },
      { label: "Total Actual Time", value: formatHours(summary.total_actual) },
      { label: "Project Variance", value: formatHours(summary.variance) },
      {
        label: "Project Efficiency Rate",
        value: formatPercent(summary.efficiency_rate),
      },
    ]);

    if (projects.length > 0) {
      writeSectionTitle(doc, "Project-wise Performance");
      writeTable(
        doc,
        [
          "Project Name",
          "Lead Developer",
          "Start Date",
          "Quality",
          "Status",
          "Total Tasks",
          "Completed",
          "Active",
          "On Hold",
          "Est. Time",
          "Actual Time",
          "Variance",
          "Efficiency",
        ],
        projects.map((p) => [
          p.name,
          p.lead_developer_name,
          formatDate(p.start_date),
          formatLabel(p.quality),
          formatLabel(p.status),
          p.total_tasks,
          p.completed_tasks,
          p.active_tasks,
          p.on_hold_tasks,
          formatHours(p.total_estimated),
          formatHours(p.total_actual),
          formatHours(p.variance),
          formatPercent(p.efficiency_rate),
        ]),
        [88, 78, 58, 45, 52, 45, 50, 40, 40, 50, 50, 48, 55],
        { fontSize: 6, truncate: 26 }
      );
    }

    writeChartsSection(doc, reportData.charts);

    const projectTaskWidths = [72, 72, 88, 48, 42, 68, 68, 46, 46, 46, 46];
    const projectTaskTableW = projectTaskWidths.reduce((a, b) => a + b, 0);

    projects.forEach((project) => {
      ensureSpace(doc, 80);
      const y = doc.y;
      const left = contentLeft(doc);
      // Name bar must match the task table width (not full page)
      doc.roundedRect(left, y, projectTaskTableW, 28, 6).fill("#ecfdf5");
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(PRIMARY_DARK)
        .text(project.name, left + 12, y + 8, {
          width: projectTaskTableW - 24,
          lineBreak: false,
          ellipsis: true,
        });
      doc.y = y + 36;

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(MUTED)
        .text(
          `Lead: ${project.lead_developer_name || "—"} · Start: ${formatDate(project.start_date)} · Status: ${formatLabel(project.status)} · Quality: ${formatLabel(project.quality)}`,
          { width: projectTaskTableW }
        );
      doc.moveDown(0.45);

      const tasks = project.tasks || reportData.tasks || [];
      if (!tasks.length) {
        doc.fontSize(9).fillColor(MUTED).text("No tasks in the selected date range.");
        doc.moveDown(0.8);
        return;
      }

      writeSectionTitle(doc, "Task-wise Breakdown");
      writeTable(
        doc,
        [
          "Task Name",
          "Assigned Developer",
          "Task Details",
          "Complexity",
          "Priority",
          "Start Time",
          "End Time",
          "Est. Time",
          "Actual Time",
          "Variance",
          "Status",
        ],
        tasks.map((t) => [
          t.name,
          t.assigned_to_name,
          t.details || "—",
          formatLabel(t.complexity),
          formatLabel(t.priority),
          formatDateTime(t.start_time),
          formatEndTime(t),
          formatHours(t.estimated_hours),
          formatHours(t.actual_hours),
          formatHours(t.variance),
          formatLabel(t.status),
        ]),
        projectTaskWidths,
        { fontSize: 6, truncate: 36 }
      );
      doc.moveDown(0.4);
    });

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i += 1) {
      doc.switchToPage(i);
      writeFooter(doc);
    }

    doc.end();
  });
};

module.exports = {
  generateTeamPdf,
  generateProjectPdf,
};

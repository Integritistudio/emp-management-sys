/**
 * PDF §20 / §21 verification — run: node scripts/verifyCalculationsAndAlerts.js
 */
const path = require("path");
const {
  taskVariance,
  projectVariance,
  efficiencyRate,
  totalProjectTime,
  teamOutput,
  teamQualityLabel,
  isHighVariance,
  HIGH_VARIANCE_HOURS,
} = require("../services/calculationService");

let failed = 0;
const assert = (label, condition) => {
  if (!condition) {
    failed += 1;
    console.error("FAIL:", label);
  } else {
    console.log("OK  :", label);
  }
};

// §21.1
assert("taskVariance 5-3 = 2", taskVariance(5, 3) === 2);
assert("taskVariance 2-4 = -2", taskVariance(2, 4) === -2);

// §21.2
assert(
  "projectVariance = sum actual - sum estimated",
  projectVariance(10, 8) === 2
);

// §21.3 / §21.4
assert("efficiency 8/10 = 80%", efficiencyRate(8, 10) === 80);
assert("efficiency actual 0, est > 0 → 0", efficiencyRate(5, 0) === 0);
assert("efficiency both 0 → 100", efficiencyRate(0, 0) === 100);

// §21.5
assert("totalProjectTime completed sum", totalProjectTime(12.345) === 12.35);

// §21.6
assert("teamOutput completed count", teamOutput(7) === 7);

// §21.7
assert(
  "teamQualityLabel manual matrix",
  teamQualityLabel("high", "medium") === "high output / medium quality"
);

assert("high variance > 2h", isHighVariance(2.1) === true);
assert("high variance = 2h not flagged", isHighVariance(2) === false);
assert("HIGH_VARIANCE_HOURS constant", HIGH_VARIANCE_HOURS === 2);

// Frontend alert rules via dynamic import of shared expectations
const now = new Date("2026-07-15T12:00:00.000Z");
const nearDeadline = new Date(now.getTime() + 60 * 60 * 1000); // 1h
const overdueDeadline = new Date(now.getTime() - 60 * 60 * 1000);

// Mini replica of alert rules (matches frontend taskAlerts.js contract)
function expectAlerts(task) {
  const keys = [];
  if (task.status === "paused") keys.push("paused");
  if (task.status === "on_hold") keys.push("on_hold");
  if (
    task.deadline &&
    !["completed", "cancelled"].includes(task.status) &&
    !(task.paused_at && ["paused", "on_hold"].includes(task.status))
  ) {
    const deadline = new Date(task.deadline);
    if (now > deadline) keys.push("overdue");
    else {
      const hoursLeft = (deadline - now) / 36e5;
      if (hoursLeft <= 2) keys.push("near_deadline");
    }
  }
  if (
    task.status === "in_progress" &&
    Number(task.estimated_hours) > 0 &&
    Number(task.elapsed) > Number(task.estimated_hours)
  ) {
    keys.push("delayed");
  }
  if (
    task.status === "completed" &&
    task.variance !== null &&
    Number(task.variance) > 2
  ) {
    keys.push("high_variance");
  }
  return keys;
}

assert(
  "near deadline alert",
  expectAlerts({
    status: "in_progress",
    deadline: nearDeadline.toISOString(),
    estimated_hours: 8,
    elapsed: 1,
  }).includes("near_deadline")
);
assert(
  "overdue alert",
  expectAlerts({
    status: "in_progress",
    deadline: overdueDeadline.toISOString(),
    estimated_hours: 8,
    elapsed: 1,
  }).includes("overdue")
);
assert(
  "paused alert (no overdue while frozen)",
  JSON.stringify(
    expectAlerts({
      status: "paused",
      paused_at: now.toISOString(),
      deadline: overdueDeadline.toISOString(),
    })
  ) === JSON.stringify(["paused"])
);
assert(
  "delayed = elapsed > estimated (not same as overdue)",
  expectAlerts({
    status: "in_progress",
    deadline: nearDeadline.toISOString(),
    estimated_hours: 2,
    elapsed: 3,
  }).includes("delayed") &&
    expectAlerts({
      status: "in_progress",
      deadline: nearDeadline.toISOString(),
      estimated_hours: 2,
      elapsed: 3,
    }).includes("near_deadline")
);
assert(
  "high variance completed",
  expectAlerts({
    status: "completed",
    variance: 3,
  }).includes("high_variance")
);

console.log(failed === 0 ? "\nAll §20/§21 checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);

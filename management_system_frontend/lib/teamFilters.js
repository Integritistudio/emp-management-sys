export function matchesEfficiencyRange(rate, range) {
  if (!range) return true;
  const value = Number(rate);
  if (Number.isNaN(value)) return false;

  switch (range) {
    case "gt_100":
      return value > 100;
    case "lt_60":
      return value < 60;
    case "60_80":
      return value >= 60 && value < 80;
    case "80_90":
      return value >= 80 && value < 90;
    case "90_100":
      return value >= 90 && value <= 100;
    default:
      return true;
  }
}

export function filterTeamMembers(members, { search, title, efficiencyRange } = {}) {
  return members.filter((member) => {
    if (title && member.title !== title) return false;
    if (efficiencyRange && !matchesEfficiencyRange(member.efficiency_rate, efficiencyRange)) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${member.full_name} ${member.email} ${member.title}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function extractDistinctTitles(members = []) {
  return [...new Set(members.map((m) => m.title).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

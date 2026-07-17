import { useEffect, useMemo, useState } from "react";
import type { FamilyData, FamilyMember, Task } from "../../data/familyData";
import { getMemberFullName } from "../../lib/utils";
import { FeatherIcon } from "../icons/FeatherIcon";

type Props = {
  data: FamilyData;
  onOpenMember: (memberId: string) => void;
  onOpenTasks: () => void;
};

type Row = {
  id: string;
  member: FamilyMember;
  contactLine: string;
  contactSub: string;
  tag: string;
  tagTone: "success" | "info" | "warning" | "theme" | "accent";
  scheduleLine: string;
  scheduleSub: string;
  status: string;
  statusTone: "success" | "warning" | "danger" | "info" | "secondary";
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDue(task: Task | undefined) {
  if (!task) return { line: "No upcoming chore", sub: "Assign from Cleaning" };
  const due = task.dueDate || task.nextDueDate;
  let line = due;
  try {
    const d = new Date(`${due}T${task.dueTime || "09:00"}:00`);
    if (!Number.isNaN(d.getTime())) {
      line = d.toLocaleString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  } catch {
    /* keep raw */
  }
  const zone = task.zone || task.room || task.category || "Household";
  return { line, sub: `${zone} · ${task.title}` };
}

function statusTone(status: string): Row["statusTone"] {
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("completed") || s === "active") return "success";
  if (s.includes("progress") || s.includes("today") || s.includes("pending")) return "warning";
  if (s.includes("skip") || s.includes("archiv")) return "danger";
  if (s.includes("review") || s.includes("snooze")) return "info";
  return "secondary";
}

function buildRows(data: FamilyData): Row[] {
  const members = data.familyMembers.filter((m) => m.status !== "archived");
  const openTasks = data.tasks.filter(
    (t) => t.status !== "Done" && t.status !== "Completed" && t.status !== "Skipped",
  );

  return members.map((member, index) => {
    const assigned = openTasks
      .filter((t) => t.assignedMemberId === member.id)
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
    const next = assigned[0];
    const schedule = formatDue(next);
    const tag =
      member.roleLabel ||
      member.role ||
      member.ageGroup ||
      (index === 0 ? "Fresh Case" : "Household");
    const memberStatus = next?.status || member.status || "active";

    return {
      id: member.id.slice(0, 8).toUpperCase(),
      member,
      contactLine: member.emergencyContact || member.schoolWorkLabel || `${getMemberFullName(member).toLowerCase().replace(/\s+/g, ".")}@home`,
      contactSub: member.allergies
        ? `Allergies · ${member.allergies}`
        : member.notes?.slice(0, 48) || "Household member",
      tag,
      tagTone: index % 3 === 0 ? "success" : index % 3 === 1 ? "theme" : "accent",
      scheduleLine: schedule.line,
      scheduleSub: schedule.sub,
      status: String(memberStatus),
      statusTone: statusTone(String(memberStatus)),
    };
  });
}

/**
 * AdminUX-style responsive schedule grid (patient table pattern)
 * adapted for household members + chore schedule — React search/pagination
 * instead of jQuery DataTables.
 */
export function HouseholdScheduleGrid({ data, onOpenMember, onOpenTasks }: Props) {
  const allRows = useMemo(() => buildRows(data), [data]);
  const [query, setQuery] = useState("");
  const [pageLength, setPageLength] = useState(5);
  const [page, setPage] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((row) => {
      const hay = [
        row.id,
        getMemberFullName(row.member),
        row.contactLine,
        row.tag,
        row.scheduleLine,
        row.scheduleSub,
        row.status,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [allRows, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageLength));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageLength, safePage * pageLength + pageLength);

  useEffect(() => {
    setPage(0);
  }, [query, pageLength]);

  useEffect(() => {
    function onDocClick() {
      setOpenMenuId(null);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="aux-card mb-4">
      <div className="aux-card-header flex-wrap gap-3">
        <div className="aux-avatar theme-info">
          <FeatherIcon name="users" size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base">Household schedule</h3>
          <p className="aux-muted">Members, tags, recent chores — AdminUX data grid</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="aux-muted flex items-center gap-2 text-sm">
            Show
            <select
              className="form-select"
              style={{ width: "auto", padding: "0.35rem 2rem 0.35rem 0.65rem" }}
              value={pageLength}
              onChange={(e) => setPageLength(Number(e.target.value))}
            >
              {[5, 10, 25].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <input
            type="search"
            className="form-control"
            style={{ width: "min(100%, 220px)" }}
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search household schedule"
          />
        </div>
      </div>

      <div className="aux-card-body aux-table-wrap">
        <table id="clientScheduleGrid" className="table aux-table aux-datatable w-100 nowrap">
          <thead>
            <tr>
              <th>ID</th>
              <th className="xs sm">Member</th>
              <th className="xs sm md">Contact info</th>
              <th className="xs sm">Tags</th>
              <th className="all">Recent Schedule</th>
              <th className="xs sm">Status</th>
              <th className="all">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="aux-muted py-6 text-center">
                  No members match this search.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const name = getMemberFullName(row.member);
                return (
                  <tr key={row.member.id}>
                    <td>{row.id}</td>
                    <td>
                      <div className="aux-person-cell">
                        <figure
                          className="avatar avatar-40 mb-0 coverimg rounded-circle"
                          style={{ background: row.member.colorTheme || "#cfe8ff" }}
                          aria-hidden
                        >
                          <span>{initials(name)}</span>
                        </figure>
                        <div>
                          <p className="mb-0 fw-medium">{name}</p>
                          <p className="text-secondary small aux-muted">
                            {row.member.ageGroup || "Household"}
                            {row.member.nickname ? ` · ${row.member.nickname}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="mb-0">{row.contactLine}</p>
                      <p className="text-secondary small aux-muted">{row.contactSub}</p>
                    </td>
                    <td>
                      <span className={`badge badge-light rounded-pill text-bg-${row.tagTone}`}>
                        {row.tag}
                      </span>
                    </td>
                    <td>
                      <p className="mb-0">{row.scheduleLine}</p>
                      <p className="text-secondary small aux-muted">{row.scheduleSub}</p>
                    </td>
                    <td>
                      <span className={`badge badge-light rounded-pill text-bg-${row.statusTone}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="aux-actions-cell lastvisible">
                      <button
                        type="button"
                        className="btn btn-square btn-link"
                        title="View"
                        onClick={() => onOpenMember(row.member.id)}
                      >
                        <i className="bi bi-eye" aria-hidden />
                      </button>
                      <div className="dropdown d-inline-block">
                        <button
                          type="button"
                          className="btn btn-link no-caret"
                          aria-expanded={openMenuId === row.member.id}
                          aria-haspopup="menu"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId((id) =>
                              id === row.member.id ? null : row.member.id,
                            );
                          }}
                        >
                          <i className="bi bi-three-dots" aria-hidden />
                        </button>
                        {openMenuId === row.member.id ? (
                          <ul className="dropdown-menu dropdown-menu-end show" role="menu">
                            <li>
                              <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => onOpenMember(row.member.id)}
                              >
                                Edit profile
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                className="dropdown-item"
                                onClick={onOpenTasks}
                              >
                                Open chores
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                className="dropdown-item theme-red"
                                onClick={() => onOpenMember(row.member.id)}
                              >
                                View details
                              </button>
                            </li>
                          </ul>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="aux-datatable-footer">
        <p className="aux-muted mb-0 text-sm">
          Showing {filtered.length === 0 ? 0 : safePage * pageLength + 1}–
          {Math.min(filtered.length, (safePage + 1) * pageLength)} of {filtered.length}
        </p>
        <nav aria-label="Schedule pagination">
          <ul className="pagination mb-0">
            <li className={`page-item${safePage === 0 ? " disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
            </li>
            {Array.from({ length: pageCount }, (_, i) => (
              <li key={i} className={`page-item${i === safePage ? " active" : ""}`}>
                <button type="button" className="page-link" onClick={() => setPage(i)}>
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item${safePage >= pageCount - 1 ? " disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

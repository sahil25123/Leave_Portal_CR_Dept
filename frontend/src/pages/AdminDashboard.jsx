import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";

function AdminDashboard() {
  const cards = [
    {
      title: "Year Management",
      description:
        "Define leave cycles and activate the year used by validations.",
      to: "/admin/years",
      cta: "Manage Years",
    },
    {
      title: "User Management",
      description: "Create and manage staff, dean, and admin accounts.",
      to: "/admin/users",
      cta: "Manage Users",
    },
    {
      title: "Holiday Management",
      description: "Add and remove holiday dates used in leave calculations.",
      to: "/admin/holidays",
      cta: "Manage Holidays",
    },
    {
      title: "All Leaves Overview",
      description: "View all leave records in read-only mode.",
      to: "/admin/leaves",
      cta: "View Leaves",
    },
  ];

  return (
    <AppShell
      title="Admin Dashboard"
      subtitle="Manage users, holidays, and leave visibility across the portal."
    >
      <section className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.to}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {card.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
            <Link
              to={card.to}
              className="mt-4 inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              {card.cta}
            </Link>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

export default AdminDashboard;

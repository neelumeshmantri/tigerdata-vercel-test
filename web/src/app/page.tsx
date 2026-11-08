
"use client";

import { useEffect, useState } from "react";

const fields = [
  { key: "q1", label: "Incident Date" },
  { key: "q2", label: "Incident Time" },
  { key: "q3", label: "Reporter Name" },
  { key: "q4", label: "Witnesses" },
  { key: "q5", label: "Incident Location" },
  { key: "q6", label: "Other Location Details" },
  { key: "q7", label: "Service Area" },
  { key: "q8", label: "Other Service Area" },
  { key: "q9", label: "People Impacted" },
  { key: "q10", label: "Contact Phone" },
  { key: "q11", label: "Person Involved Name" },
  { key: "q12", label: "Similar Incident Before" },
  { key: "q13", label: "Severity" },
  { key: "q14", label: "Injury Reported" },
  { key: "q15", label: "Injury Details", long: true },
  { key: "q16", label: "Behavioural Concern" },
  { key: "q17", label: "Behaviour Details", long: true },
  { key: "q18", label: "Facility Concern" },
  { key: "q19", label: "Facility Details", long: true },
  { key: "q20", label: "Emergency Code Called" },
  { key: "q21", label: "Emergency Code" },
  { key: "q22", label: "Panic Button Used" },
  { key: "q23", label: "Emergency Services Contacted" },
  { key: "q24", label: "Other Response" },
  { key: "q25", label: "Services Involved" },
  { key: "q26", label: "Police Badge Number" },
  { key: "q27", label: "Police Incident Details" },
  { key: "q28", label: "FCS Contacted" },
  { key: "q29", label: "FCS Contact Person" },
  { key: "q30", label: "Contact Notified" },
  { key: "q31", label: "Interventions", long: true },
  { key: "q32", label: "Incident Description", long: true },
  { key: "q33", label: "Follow-up Required" },
  { key: "q34", label: "Debrief", long: true },
  { key: "q35", label: "Supervisor Name" },
] as const;

type Incident = {
  id: number;
  created_at: string;
  answers: Record<string, unknown>;
};

const emptyAnswers = () =>
  Object.fromEntries(fields.map((field) => [field.key, ""])) as Record<
    string,
    string
  >;

function displayValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value) || "—";
}

export default function Home() {
  const [records, setRecords] = useState<Incident[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>(emptyAnswers);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Incident | null>(null);

  async function loadRecords() {
    try {
      const response = await fetch("/api/submit");
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setRecords(data.records);
    } catch {
      setMessage("Could not load incidents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  function updateAnswer(key: string, value: string) {
    setAnswers((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const cleanAnswers: Record<string, unknown> = {};

      for (const field of fields) {
        const value = answers[field.key].trim();

        if (value === "") continue;

        // Preserve JSON arrays/objects where supplied.
        if (["q15", "q17", "q19", "q31"].includes(field.key)) {
          try {
            cleanAnswers[field.key] = JSON.parse(value);
          } catch {
            cleanAnswers[field.key] = value;
          }
        } else {
          cleanAnswers[field.key] = value;
        }
      }

      const response = await fetch("/api/submit", {
        method: editingId !== null ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          answers: cleanAnswers,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setMessage(editingId !== null ? "Incident updated!" : "Incident saved!");
      setAnswers(emptyAnswers());
      setEditingId(null);
      setSelected(null);

      await loadRecords();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(record: Incident) {
    const updated = emptyAnswers();

    for (const field of fields) {
      const value = record.answers?.[field.key];

      updated[field.key] =
        value === null || value === undefined
          ? ""
          : typeof value === "string"
            ? value
            : JSON.stringify(value);
    }

    setAnswers(updated);
    setEditingId(record.id);
    setSelected(null);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setAnswers(emptyAnswers());
    setMessage("");
  }

  async function deleteRecord(id: number) {
    if (!window.confirm("Delete this incident record?")) return;

    try {
      const response = await fetch("/api/submit", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setMessage("Incident deleted.");
      if (selected?.id === id) setSelected(null);

      await loadRecords();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not delete incident."
      );
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="mx-auto max-w-7xl space-y-8">

        <header>
          <h1 className="text-3xl font-bold">
            Incident Reporting Manager
          </h1>
          <p className="mt-2 text-gray-600">
            Create, manage and review incident records.
          </p>
        </header>

        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-6 text-xl font-semibold">
            {editingId !== null ? "Edit Incident" : "New Incident Report"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">

            <div className="grid gap-5 md:grid-cols-2">
              {fields.map((field) => (
                <div
                  key={field.key}
                  className={field.long ? "md:col-span-2" : ""}
                >
                  <label className="mb-2 block text-sm font-medium">
                    {field.label}
                  </label>

                  {field.long ? (
                    <textarea
                      className="w-full rounded-lg border border-gray-300 p-3"
                      rows={3}
                      value={answers[field.key]}
                      onChange={(e) =>
                        updateAnswer(field.key, e.target.value)
                      }
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  ) : (
                    <input
                      className="w-full rounded-lg border border-gray-300 p-3"
                      value={answers[field.key]}
                      onChange={(e) =>
                        updateAnswer(field.key, e.target.value)
                      }
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Incident"
                    : "Save Incident"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-lg border px-6 py-3"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {message && (
            <p className="mt-4 text-sm font-medium" role="status">
              {message}
            </p>
          )}
        </section>

        <section className="rounded-xl bg-white p-6 shadow">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Incident Records</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
              {records.length} records
            </span>
          </div>

          {loading ? (
            <p>Loading incidents...</p>
          ) : records.length === 0 ? (
            <p className="text-gray-500">No incidents recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="p-3">ID</th>
                    <th className="p-3">Incident Date</th>
                    <th className="p-3">Reporter</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b">
                      <td className="p-3">{record.id}</td>
                      <td className="p-3">
                        {displayValue(record.answers?.q1)}
                      </td>
                      <td className="p-3">
                        {displayValue(record.answers?.q3)}
                      </td>
                      <td className="p-3">
                        {displayValue(record.answers?.q5)}
                      </td>
                      <td className="p-3">
                        {displayValue(record.answers?.q13)}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => setSelected(record)}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            View
                          </button>

                          <button
                            onClick={() => startEditing(record)}
                            className="font-medium text-green-600 hover:underline"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteRecord(record.id)}
                            className="font-medium text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selected && (
          <section className="rounded-xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Incident #{selected.id}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-black"
              >
                Close
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className="border-b pb-3">
                  <p className="text-sm font-medium text-gray-500">
                    {field.label}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {displayValue(selected.answers?.[field.key])}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}

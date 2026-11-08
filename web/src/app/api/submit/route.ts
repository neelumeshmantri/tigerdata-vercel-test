
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

const validAnswers = (answers: unknown) =>
  answers !== null &&
  typeof answers === "object" &&
  !Array.isArray(answers);

const selectRecords = `
  SELECT
    id,
    created_at,
    answers,
    incident_date,
    incident_time,
    reporter_name,
    witnesses,
    incident_location,
    other_location_details,
    service_area,
    other_service_area,
    people_impacted,
    contact_phone,
    person_involved_name,
    similar_incident_before,
    severity,
    injury_reported,
    injury_details,
    behavioural_concern,
    behaviour_details,
    facility_concern,
    facility_details,
    emergency_code_called,
    emergency_code,
    panic_button_used,
    emergency_services_contacted,
    other_response,
    services_involved,
    police_badge_number,
    police_incident_details,
    fcs_contacted,
    fcs_contact_person,
    contact_notified,
    interventions,
    incident_description,
    follow_up_required,
    debrief,
    supervisor_name
  FROM test_submissions
`;

// READ
export async function GET() {
  try {
    const result = await pool.query(
      `${selectRecords} ORDER BY created_at DESC`
    );

    return NextResponse.json({ records: result.rows });
  } catch (error) {
    console.error("Fetch failed:", error);
    return NextResponse.json(
      { error: "Could not fetch incidents." },
      { status: 500 }
    );
  }
}

// CREATE
export async function POST(request: Request) {
  try {
    const { answers } = await request.json();

    if (!validAnswers(answers)) {
      return NextResponse.json(
        { error: "Valid incident answers are required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO test_submissions (answers)
       VALUES ($1::jsonb)
       RETURNING id, created_at, answers`,
      [JSON.stringify(answers)]
    );

    return NextResponse.json({ record: result.rows[0] });
  } catch (error) {
    console.error("Insert failed:", error);
    return NextResponse.json(
      { error: "Could not save incident." },
      { status: 500 }
    );
  }
}

// UPDATE
export async function PATCH(request: Request) {
  try {
    const { id, answers } = await request.json();

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0 ||
      !validAnswers(answers)
    ) {
      return NextResponse.json(
        { error: "Valid ID and incident answers are required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE test_submissions
       SET answers = $1::jsonb
       WHERE id = $2
       RETURNING id, created_at, answers`,
      [JSON.stringify(answers), id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Incident not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ record: result.rows[0] });
  } catch (error) {
    console.error("Update failed:", error);
    return NextResponse.json(
      { error: "Could not update incident." },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return NextResponse.json(
        { error: "A valid incident ID is required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `DELETE FROM test_submissions
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Incident not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json(
      { error: "Could not delete incident." },
      { status: 500 }
    );
  }
}

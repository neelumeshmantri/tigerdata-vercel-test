
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO test_submissions (name, email)
       VALUES ($1, $2)
       RETURNING id, name, email, created_at`,
      [name, email]
    );

    return NextResponse.json({
      success: true,
      record: result.rows[0],
    });
  } catch (error) {
    console.error("Database submission failed:", error);
    return NextResponse.json(
      { error: "Could not save the record." },
      { status: 500 }
    );
  }
}

import pool from "@/config/db";
import { NextResponse } from "next/server"


export async function POST(req) {

    try {
        const data = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO locations (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

        const { rows } = await pool.query(query, values);
        const reimbursement = rows[0];
        const userQuery = `SELECT name FROM users WHERE id = $1;`;
        const userResult = await pool.query(userQuery, [data.submitted_by]);
        const user_name = userResult.rows.length > 0 ? userResult.rows[0].name : null;

        return NextResponse.json(
            { ...reimbursement, user_name }
            , { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: 'Error saving data' }, { status: 500 })
    }
}


export async function GET(req, { params }) {


    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const user = searchParams.get('user')


    try {


        if (!user) {
            const query = `
        SELECT l.*, u.id AS user_id, u.name AS user_name
        FROM locations l
        INNER JOIN (
            SELECT user_id, MAX(created_at) AS latest_created_at
            FROM locations
            GROUP BY user_id
        ) latest ON l.user_id = latest.user_id AND l.created_at = latest.latest_created_at
        INNER JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC;
    `;

            const result = await pool.query(query);
            return NextResponse.json(result.rows, { status: 200 });
        } else {
            const query = `
            SELECT l.*, u.id AS user_id, u.name AS user_name
            FROM locations l
            INNER JOIN users u ON l.user_id = u.id
            WHERE user_id = $1
            ORDER BY l.created_at ASC
          `;

            const result = await pool.query(query, [user]);
            return NextResponse.json(result.rows, { status: 200 });
        }


    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }
}


export const revalidate = 0
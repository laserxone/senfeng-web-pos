import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {


    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const user = searchParams.get('user')

    try {
        let query = `
        SELECT 
          r.*, 
          u.id AS user_id, 
          u.name AS submitted_by_name
        FROM reimbursement r
        INNER JOIN users u ON r.submitted_by = u.id
        WHERE r.date BETWEEN $1 AND $2 AND submitted_by = $3 ORDER BY r.date DESC;
      `;
        const emailResult = await pool.query(`SELECT id FROM users WHERE email = $1`, [user])


        const result = await pool.query(query, [start_date, end_date, emailResult.rows[0].id]);
        return NextResponse.json(result.rows, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


    return NextResponse.json({ message: 'done' }, { status: 200 })
}

export async function POST(req) {
    const { data } = await req.json()
    try {
        for (const item of data) {

            await pool.query(
                `UPDATE customer SET number = $1 WHERE id = $2`,
                [item.number, item.id]
            );

            console.log(item.id, "saved")
        }
        return NextResponse.json({ message: "Done" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error }, { status: 500 })
    }
}

export const revalidate = 0
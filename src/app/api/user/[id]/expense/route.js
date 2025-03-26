
import pool from "@/config/db";
import { NextResponse } from "next/server"


export async function GET(req, { params }) {

    const { id } = await params
    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    try {
        let query = `
    SELECT 
    r.*, 
    u.id AS user_id, 
    u.name AS submitted_by_name
FROM branchexpenses r
INNER JOIN users u ON r.submitted_by = u.id
    `;

        const queryParams = [id];

        if (start_date && end_date) {
            query += ` WHERE r.date BETWEEN $2 AND $3`;
            queryParams.push(start_date, end_date);
        }
        query += ` ORDER BY r.date DESC;`;
        const result = await pool.query(query, queryParams);
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}


export const revalidate = 0
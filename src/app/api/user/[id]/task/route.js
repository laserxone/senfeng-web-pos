
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
    t.*, 
    u.id AS user_id, 
    u.name AS assigned_to_name,
    u.email AS assigned_to_email
FROM task t
INNER JOIN users u ON t.assigned_to = u.id
WHERE u.id = $1
    `;

        const queryParams = [id];

        if (start_date && end_date) {
            query += ` AND t.created_at BETWEEN $2 AND $3`;
            queryParams.push(start_date, end_date);
        }
        query += ` ORDER BY t.created_at DESC;`;
        const result = await pool.query(query, queryParams);
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}


export const revalidate = 0
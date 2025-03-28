
import pool from "@/config/db";
import { NextResponse } from "next/server"

export async function GET(req, { params }) {


    const searchParams = req.nextUrl.searchParams

    try {
        const month = searchParams.get('month')
        const year = searchParams.get('year')
        const salaryQuery = `
            SELECT s.*, u.name  
FROM salaries s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.month = $1 AND s.year = $2 AND issued = $3;
        `;
        const salaryResult = await pool.query(salaryQuery, [month, year, true]);

        return NextResponse.json(salaryResult.rows, { status: 200 })

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}



export const revalidate = 0
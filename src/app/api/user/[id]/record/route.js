

import pool from "@/config/db";
import { NextResponse } from "next/server"

export async function GET(req, { params }) {

    try {

        const {id} = await params

        const salaries = await pool.query(`
            SELECT 
                s.*, 
                u.name AS user_name 
            FROM salaries s
            INNER JOIN users u ON s.user_id = u.id
            WHERE s.issued = $1 AND s.user_id = $2
            ORDER BY s.year DESC, s.month DESC;
        `, [true, id]);

        return NextResponse.json(salaries.rows, { status: 200 });
    } catch (error) {

        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}



export const revalidate = 0
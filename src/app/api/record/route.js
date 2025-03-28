

import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import moment from "moment";
import { NextResponse } from "next/server"

export async function GET(req, { params }) {

    try {

        const salaries = await pool.query(`
            SELECT 
                s.*, 
                u.name AS user_name 
            FROM salaries s
            INNER JOIN users u ON s.user_id = u.id
            ORDER BY s.year DESC, s.month DESC;
        `);

        return NextResponse.json(salaries.rows, { status: 200 });
    } catch (error) {

        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}



export const revalidate = 0
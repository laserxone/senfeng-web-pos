import pool from "@/config/db";
import { NextResponse } from "next/server"


export async function GET(req) {

    try {
        const query = `
    SELECT * FROM settings;
    `;

        const result = await pool.query(query);
        return NextResponse.json(result.rows[0], { status: 200 })

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}


export const revalidate = 0
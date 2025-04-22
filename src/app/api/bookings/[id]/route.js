import pool from "@/config/db";
import { NextResponse } from "next/server";


export async function GET(req, {params}) {

    const {id} = await params

    try {
        const result = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [id])
        return NextResponse.json(result.rows[0], { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Error occured" }, { status: 500 })
    }
}

export const revalidate = 0
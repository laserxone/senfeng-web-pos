import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET() {
    const result = await pool.query(`SELECT id, number FROM customer`)

    return NextResponse.json(result.rows, { status: 200 })
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
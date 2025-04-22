import pool from "@/config/db";
import { NextResponse } from "next/server"


export async function POST(req) {
    let { number } = await req.json()

    try {
        if (!number) {
            return NextResponse.json({ message: "Number missing" }, { status: 200 })
        }

        number = number.replace(/\s|-/g, "");

        const query = `
        SELECT id, name, owner, number FROM customer 
        WHERE $1 = ANY(number)
      `;

        const result = await pool.query(query, [number]);

        if (result.rows.length > 0) {
            return NextResponse.json(result.rows, { status: 200 })
        }

        return NextResponse.json([], { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Server error" }, { status: 500 })
    }

}

export const revalidate = 0
import pool from "@/config/db";
import { NextResponse } from "next/server";


export async function GET() {

    try {
        const result = await pool.query(`SELECT * FROM bookings`)
        return NextResponse.json(result.rows, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Error occured" }, { status: 500 })
    }
}

export async function POST(req) {
    const data = await req.json()

    try {

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
    INSERT INTO bookings (${fields.join(", ")})
    VALUES (${placeholders})
    RETURNING *
`;

        const { rows } = await pool.query(query, values);
        return NextResponse.json(rows[0], { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error occured" }, { status: 500 });
    }

}

export async function PUT(req, { params }) {
    try {
        const data = await req.json();
        const { id, ...updates } = data;

        if (!id) {
            return NextResponse.json({ message: "ID is required" }, { status: 400 });
        }

        const fields = [];
        const values = [];

        Object.entries(updates).forEach(([key, value], index) => {
            if (value !== undefined) {
                fields.push(`${key} = $${index + 1}`);
                values.push(value);
            }
        });

        if (fields.length === 0) {
            return NextResponse.json({ message: "No valid data provided for update" }, { status: 400 });
        }

        values.push(id);
        const query = `
            UPDATE bookings 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `;

        await pool.query(query, values);


        return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating inventory data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export const revalidate = 0
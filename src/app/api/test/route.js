import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {

    try {
        const salesQuery = "SELECT customer_id, sell_by FROM sale";
        const { rows: sales } = await pool.query(salesQuery);
        const updatePromises = sales.map(({ customer_id, sell_by }) => {
            const updateQuery = "UPDATE customer SET ownership = $1 WHERE id = $2";
            return pool.query(updateQuery, [sell_by, customer_id]);
        });

        await Promise.all(updatePromises);
        return NextResponse.json({ message: "Ownership updated" }, { status: 200 })

    } catch (error) {
        console.error("Error updating customer ownership:", error);
    }
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

import pool from '@/config/db';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
    const { id } = await params


    try {
        const { name, price, qty, image, threshold, new_order } = await req.json()

        if (!name || !price || !qty || !image || !id || !threshold || !new_order) {
            return NextResponse.json({ message: "All fields are required." }, { status: 400 });
        }

        // Update the fields in the inventory table where id matches
        const result = await pool.query(
            "UPDATE inventory SET name = $1, price = $2, qty = $3, img = $4, threshold=$5, new_order=$6 WHERE id = $7 RETURNING *",
            [name, price, qty, image, threshold, new_order, id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ message: "Inventory item not found." }, { status: 404 });
        }

        return NextResponse.json(result.rows[0], { status: 200 })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: "Processing error" }, { status: 500 })
    }
}

export const revalidate = 0
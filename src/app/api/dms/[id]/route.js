import pool from "@/config/db"
import { NextResponse } from "next/server"


export async function DELETE(req, { params }) {

    const { id } = await params
    if (!id) {
        return NextResponse.json({ message: "Id is missing" }, { status: 400 })
    }

    try {
        await pool.query(`DELETE FROM dms WHERE id = $1`, [id])
        return NextResponse.json({ message: "Document deleted" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }

}

export const revalidate = 0
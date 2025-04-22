import pool from "@/config/db"
import { NextResponse } from "next/server"


export async function DELETE(req, { params }) {

    const { eid } = await params
    if (!eid) {
        return NextResponse.json({ message: "Id is missing" }, { status: 400 })
    }

    try {
        await pool.query(`DELETE FROM branchexpenses WHERE id = $1`, [eid])
        return NextResponse.json({ message: "Branch expense delete" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }

}

export const revalidate = 0
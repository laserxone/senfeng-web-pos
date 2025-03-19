import pool from "@/config/db";
import { NextResponse } from "next/server"

export async function POST(req, { params }) {
    try {
        const { dp, cnic, education, police, name } = await req.json();
        const { id } = await params;



        const insertQuery = `
            UPDATE users SET dp = $1, cnic = $2, education = $3, police = $4, name = $5 WHERE id = $6;
        `;
        await pool.query(insertQuery, [dp, cnic, education, police, name, id]);

        return NextResponse.json({
            message: "Profile updated",
        }, { status: 200 });



    } catch (error) {
        console.error("Error inserting reimbursement data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export const revalidate = 0
import pool from "@/config/db";
import { NextResponse } from "next/server"

export async function POST(req, { params }) {
    try {
        const { dp, cnic, education, police, name, resume, number, kin_number } = await req.json();
        const { id } = await params;



        const insertQuery = `
            UPDATE users SET dp = $1, cnic = $2, education = $3, police = $4, name = $5, resume = $6, number = $7, kin_number = $8 WHERE id = $9;
        `;
        await pool.query(insertQuery, [dp, cnic, education, police, name, resume, number, kin_number, id]);

        return NextResponse.json({
            message: "Profile updated",
        }, { status: 200 });



    } catch (error) {
        console.error("Error inserting reimbursement data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export const revalidate = 0
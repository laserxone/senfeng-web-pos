import pool from "@/config/db";
import { NextResponse } from "next/server"

export async function POST(req, { params }) {
    try {
        const { amount, title, description, date, city, image } = await req.json();
        const { id } = await params;
        if (!amount || !title || !description || !date || !city || !image) {
            return NextResponse.json({ message: "Parameters missing" }, { status: 400 });
        }

        const insertQuery = `
            INSERT INTO reimbursement (amount, title, description, date, city, image, submitted_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
        `;
        const { rows } = await pool.query(insertQuery, [amount, title, description, date, city, image, id]);
        const reimbursement = rows[0];
        const userQuery = `SELECT name FROM users WHERE id = $1;`;
        const userResult = await pool.query(userQuery, [id]);
        const submitted_by_name = userResult.rows.length > 0 ? userResult.rows[0].name : null;

        return NextResponse.json({
            message: "Reimbursement added successfully",
            reimbursement: { ...reimbursement, submitted_by_name }
        }, { status: 200 });

    } catch (error) {
        console.error("Error inserting reimbursement data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}



export async function GET(req, { params }) {

    const { id } = await params

    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    try {
        let query = `
        SELECT 
          r.*, 
          u.id AS user_id, 
          u.name AS submitted_by_name
        FROM reimbursement r
        INNER JOIN users u ON r.submitted_by = u.id
        WHERE u.id = $1
      `;
    
      const queryParams = [id];
    
        if (start_date && end_date) {
            query += ` AND r.date BETWEEN $2 AND $3`;
            queryParams.push(start_date, end_date);
        }
    
      query += ` ORDER BY r.date DESC;`;
    
      const result = await pool.query(query, queryParams);
      return NextResponse.json(result.rows, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


    return NextResponse.json({ message: 'done' }, { status: 200 })
}


export const revalidate = 0
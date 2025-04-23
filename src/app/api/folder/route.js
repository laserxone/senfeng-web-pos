import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req) {

    const searchParams = req.nextUrl.searchParams
    const folder = searchParams.get('folder');
const isRoot = !folder || folder === "null";

    let documents
    let folders
    try {
        if (!isRoot) {
            documents = await pool.query(`SELECT * FROM document WHERE folder_id = $1 ORDER BY id ASC`, [folder])
            folders = await pool.query(`SELECT * FROM folder WHERE parent_folder = $1 ORDER BY id ASC`, [folder])
        } else {
            documents = await pool.query(`SELECT * FROM document WHERE folder_id IS NULL ORDER BY id ASC`)
            folders = await pool.query(`SELECT * FROM folder WHERE parent_folder IS NULL ORDER BY id ASC`)
        }

        return NextResponse.json({ folders: folders.rows, documents: documents.rows }, { status: 200 })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: "Error occured" }, { status: 500 })
    }
}


export async function POST(req) {

    try {
        const data = await req.json();


        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }



        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO folder (${fields.join(", ")})
        VALUES (${placeholders})
    `;

        await pool.query(query, values);

        console.log("data inserted successfully");
        return NextResponse.json({ message: "Inserted successfully" }, { status: 201 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}

export const revalidate = 0
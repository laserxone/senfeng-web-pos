import pool from "@/config/db";
import { NextResponse } from "next/server";



export async function POST(req) {

    try {
        const data = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ error: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO payment (${fields.join(", ")})
        VALUES (${placeholders})
    `;

        await pool.query(query, values);

        return NextResponse.json({
            message: "Payment added successfully",
        }, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding payment' }, { status: 500 })
    }
}


export async function PUT(req, {params}) {
    try {
        const data = await req.json();
        console.log(data)
        const {id, ...updates} = data;
      
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
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
            return NextResponse.json({ error: "No valid data provided for update" }, { status: 400 });
        }
  
        values.push(id); // Add ID as the last parameter for WHERE clause
        const query = `
            UPDATE payment 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `;
  
        await pool.query(query, values);
  
        console.log("data updated successfully");
        return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }


export const revalidate = 0
import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {





}


export async function POST(req) {
    const { data } = await req.json(); // Get the incoming data from the request

    try {
        // Loop through each item in the data
        for (const item of data) {
            const query = `
                INSERT INTO customer (created_at, owner, name, number, location, lead, ownership, platform, email)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id, created_at, owner, name, number, location, lead, ownership, platform;
            `;


            const values = [
                item.date ? new Date(item.date) : new Date(), // Ensure the date is valid or set to current date
                item.owner ? item?.owner?.toUpperCase() : "",
                item.name ? item?.name?.toUpperCase() : "",
                item.number,
                item.location,
                item.lead ? Number(item.lead) : null, // Convert lead to number or null if it's missing
                item.ownership ? Number(item.ownership) : null, // Convert ownership to number or null if missing
                item.platform,
                item?.email ? item?.email : ""
            ];

            // Execute the query to insert the data into the database
            const result = await pool.query(query, values);
            console.log("Data entered for ", item.owner);
        }
        console.log("all data added")
        // Return a successful response
        return NextResponse.json({ message: "All data inserted" }, { status: 200 });
    } catch (error) {
        console.error('Error inserting data:', error);
        return NextResponse.json({ message: "Error", message: error.message }, { status: 500 });
    }
}


export const revalidate = 0
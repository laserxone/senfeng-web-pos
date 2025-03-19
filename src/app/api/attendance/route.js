import pool from "@/config/db";
import { NextResponse } from "next/server"

export async function POST(req) {
    const { data } = await req.json();
    const client = await pool.connect();

    try {
        for (const item of data) {
            // Lookup user ID using email
            const userQuery = `SELECT id FROM users WHERE email = $1`;
            const userResult = await client.query(userQuery, [item.attendanceBy]);
            let userId = userResult.rows.length ? userResult.rows[0].id : null;

            const query = `
                INSERT INTO attendance(
                    user_id, time_in, time_out, image_time_in, image_time_out, 
                    location_time_in, location_time_out, note_time_in, note_time_out
                )
                VALUES (
                    $1, TO_TIMESTAMP($2 / 1000.0), TO_TIMESTAMP($3 / 1000.0), $4, $5, 
                    $6, $7, $8, $9
                )
            `;

            const values = [
                userId,
                Number(item.timeIn),
                item.timeOut ? Number(item.timeOut) : null, // Convert if exists, else null
                item.imageTimeIn || "", // Default to empty string
                item.imageTimeOut || "", // Default to empty string
                Array.isArray(item.locationTimeIn) ? item.locationTimeIn : [], // Default to empty array
                Array.isArray(item.locationTimeOut) ? item.locationTimeOut : [], // Default to empty array
                item.noteTimeIn || "", // Default to empty string
                item.noteTimeOut || "" // Default to empty string
            ];

            await client.query(query, values);
        }

        console.log("Attendance data inserted successfully");
    } catch (error) {
        console.error("Error inserting attendance data:", error);
    } finally {
        client.release();
    }

    return NextResponse.json({ message: "done" }, { status: 200 });
}

// export async function POST(req) {

//     try {
//         const data = await req.json();

//         if (!data || Object.keys(data).length === 0) {
//             return NextResponse.json({ error: "No data provided for insertion" }, { status: 400 });
//         }

//         const fields = Object.keys(data);
//         const values = Object.values(data);
//         const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

//         const query = `
//         INSERT INTO attendance (${fields.join(", ")})
//         VALUES (${placeholders})
//     `;

//         await pool.query(query, values);

//         console.log("data inserted successfully");
//         return NextResponse.json({ message: "Inserted successfully" }, { status: 201 });

//     } catch (error) {
//         console.error('Error inserting data: ', error);
//         return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
//     }
// }


export async function GET(req) {

    try {
        const query = `
    SELECT 
    t.*, 
    u.id AS user_id, 
    u.name AS user_name,
    u.email AS user_email
FROM attendance t
INNER JOIN users u ON t.user_id = u.id ORDER BY time_in DESC;
    `;

        const result = await pool.query(query);
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}


export const revalidate = 0
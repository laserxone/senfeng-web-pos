import pool from "@/config/db";
import { NextResponse } from "next/server"

// export async function POST(req) {

//     const { data } = await req.json();
//     const client = await pool.connect();

//     try {
//         for (const item of data) {
//             // Lookup user ID using email
//             const userQuery = `SELECT id FROM users WHERE email = $1`;
//             const userResult = await client.query(userQuery, [item.submittedBy]);

//             let submittedById = userResult.rows.length ? userResult.rows[0].id : null;

//             const query = `
//                 INSERT INTO reimbursement(
//                     created_at, amount, description, image, title, date, submitted_by
//                 )
//                 VALUES (
//                     TO_TIMESTAMP($1 / 1000.0), $2, $3, $4, $5, TO_TIMESTAMP($6 / 1000.0), $7
//                 )
//             `;

//             const values = [
//                 Number(item.dateCreated), // created_at (converted from ms)
//                 item.amount, // amount
//                 item.description, // description
//                 item.image, // image
//                 item.title, // title
//                 Number(item.TimeStamp), // date (converted from ms)
//                 submittedById // submitted_by (user ID from users table)
//             ];

//             await client.query(query, values);
//         }

//         console.log('Reimbursement data inserted successfully');
//     } catch (error) {
//         console.error('Error inserting reimbursement data:', error);
//     } finally {
//         client.release();
//     }



//     return NextResponse.json({ message: 'done' }, { status: 200 })
// }


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
        INSERT INTO reimbursement (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

       const {rows} =  await pool.query(query, values);
       const reimbursement = rows[0];
       const userQuery = `SELECT name FROM users WHERE id = $1;`;
       const userResult = await pool.query(userQuery, [data.submitted_by]);
       const submitted_by_name = userResult.rows.length > 0 ? userResult.rows[0].name : null;

        console.log("data inserted successfully");
        return NextResponse.json({
            message: "Reimbursement added successfully",
            reimbursement: { ...reimbursement, submitted_by_name }
        }, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}


export async function GET(req) {

    try {
        const query = `
    SELECT 
    r.*, 
    u.id AS user_id, 
    u.name AS submitted_by_name
FROM reimbursement r
INNER JOIN users u ON r.submitted_by = u.id ORDER BY date DESC;
    `;

        const result = await pool.query(query);
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


    return NextResponse.json({ message: 'done' }, { status: 200 })
}


export const revalidate = 0
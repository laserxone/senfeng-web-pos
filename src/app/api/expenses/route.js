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
//                 INSERT INTO branchexpenses(
//                     created_at, amount, note, image , date, submitted_by
//                 )
//                 VALUES (
//                     TO_TIMESTAMP($1 / 1000.0), $2, $3, $4, TO_TIMESTAMP($5 / 1000.0), $6
//                 )
//             `;

//             const values = [
//                 Number(item.dateCreated), // created_at (converted from ms)
//                 Number(item.amount), // amount
//                 item.note, // description
//                 item.image, // image
//                 Number(item.date), // date (converted from ms)
//                 submittedById // submitted_by (user ID from users table)
//             ];

//             await client.query(query, values);
//         }

//         console.log('Expenses data inserted successfully');
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
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO branchexpenses (${fields.join(", ")})
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


export async function GET(req, { params }) {

  
    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    try {
        let query = `
    SELECT 
    r.*, 
    u.id AS user_id, 
    u.name AS submitted_by_name
FROM branchexpenses r
INNER JOIN users u ON r.submitted_by = u.id
    `;

        const queryParams = [];

        if (start_date && end_date) {
            query += ` WHERE r.date BETWEEN $1 AND $2`;
            queryParams.push(start_date, end_date);
        }
        query += ` ORDER BY r.date DESC;`;
        const result = await pool.query(query, queryParams);
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}


export const revalidate = 0
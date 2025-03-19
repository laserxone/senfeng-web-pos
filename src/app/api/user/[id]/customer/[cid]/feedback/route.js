import pool from "@/config/db";
import { NextResponse } from "next/server"


// export async function POST(req) {

//     const { data } = await req.json();
//     const client = await pool.connect();

//     try {
//         for (const item of data) {
//             // Lookup user ID using email
//             const userQuery = `SELECT id FROM customer WHERE old_ref = $1`;
//             const userResult = await client.query(userQuery, [item.clientID]);

//             let clientId = userResult.rows.length ? userResult.rows[0].id : null;

//             const query = `
//                 INSERT INTO feedback(
//                     created_at, customer_id, note, status
//                 )
//                 VALUES (
//                     TO_TIMESTAMP($1 / 1000.0), $2, $3, $4
//                 )
//             `;

//             const values = [
//                 Number(item.TimeStamp),
//                 clientId, 
//                 item.note, 
//                 item.status,
//             ];

//             await client.query(query, values);
//         }

//         console.log('Feedback data inserted successfully');
//     } catch (error) {
//         console.error('Error inserting reimbursement data:', error);
//     } finally {
//         client.release();
//     }



//     return NextResponse.json({ message: 'done' }, { status: 200 })
// }



export async function GET(req, {params}) {

    const {id, cid} = await params


    try {
        const result = await pool.query(`SELECT * FROM feedback WHERE customer_id = $1`, [cid])
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }
}

export async function POST(req, { params }) {
    const { id, cid } = await params
    const { next_followup, feedback, top_follow, type } = await req.json()

   

    try {
        const query = `
        INSERT INTO feedback(
            user_id, customer_id, feedback, next_followup, top_follow, type
        )
        VALUES (
            $1, $2, $3, $4, $5, $6
        )
    `;

        const values = [
            id,
            cid,
            feedback,
            next_followup,
            top_follow,
            type
        ];

        await pool.query(query, values);
        return NextResponse.json({ message: 'done' }, { status: 200 })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: 'Error' }, { status: 500 })
    }


}

export const revalidate = 0
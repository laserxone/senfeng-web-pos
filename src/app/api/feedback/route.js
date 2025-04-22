import pool from "@/config/db";
import moment from "moment";
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



export async function GET(req) {

    try {
        const query = `
SELECT 
    f.*, 
    c.id AS customer_id, 
    c.name AS customer_name,
    c.owner AS customer_owner,
    u.id AS user_id,
    u.name AS user_name
FROM feedback f
LEFT JOIN customer c ON f.customer_id = c.id
LEFT JOIN users u ON f.user_id = u.id
ORDER BY created_at DESC;

    `;

        const result = await pool.query(query);
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
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

        // Check and process next_followup
        if (data.next_followup) {
            const nextFollowupDate = moment(data.next_followup);
            const twoWeeksLater = moment().add(2, 'weeks');

            if (nextFollowupDate.isValid() && nextFollowupDate.isBefore(twoWeeksLater)) {
                data.followup_type = "weekly";
            } else {
                data.followup_type = "monthly";
            }

            // Ensure followup_type is added to fields and values
            if (!fields.includes("followup_type")) {
                fields.push("followup_type");
                values.push(data.followup_type);
            }
        }

        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
            INSERT INTO feedback (${fields.join(", ")})
            VALUES (${placeholders})
            `;

        await pool.query(query, values);

        console.log("Data inserted successfully");
        return NextResponse.json({ message: "Inserted successfully" }, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}

export const revalidate = 0
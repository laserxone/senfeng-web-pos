import pool from "@/config/db";
import { NextResponse } from "next/server"

// export async function POST(req) {

//     const { data } = await req.json();
//     const client = await pool.connect();

//     try {
//         for (const item of data) {
//             // Lookup user ID using email
//             const userQuery = `SELECT id FROM users WHERE email = $1`;
//             const userResult = await client.query(userQuery, [item.assignedTo]);

//             let submittedById = userResult.rows.length ? userResult.rows[0].id : null;

//             const query = `
//                 INSERT INTO task(
//                     created_at, assigned_to, status, task_name , type
//                 )
//                 VALUES (
//                     TO_TIMESTAMP($1 / 1000.0), $2, $3, $4, $5
//                 )
//             `;

//             const values = [
//                 Number(item.TimeStamp), // created_at (converted from ms)
//                 submittedById,
//                 item.status, // description
//                 item.taskName, // image
//                 item.type
//             ];

//             await client.query(query, values);
//         }

//         console.log('task data inserted successfully');
//     } catch (error) {
//         console.error('Error inserting task data:', error);
//     } finally {
//         client.release();
//     }



//     return NextResponse.json({ message: 'done' }, { status: 200 })
// }


export async function POST(req) {
    try {
        const { task_name, type, client, status, assigned_to } = await req.json();

        if (!task_name || !type || !status || !assigned_to) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        let taskName = task_name;

        if (client) {
            const clientResult = await pool.query("SELECT name FROM customer WHERE id = $1", [client]);
            if (clientResult.rows.length > 0) {
                taskName += ` - ${clientResult.rows[0].name}`;
                const query = `
                INSERT INTO task(
                    assigned_to, status, task_name, type, created_at, customer_id
                )
                VALUES ($1, $2, $3, $4, NOW(), $5) 
            `;
                const values = [assigned_to, status, taskName, type, client];
                await pool.query(query, values);
                return NextResponse.json({ message: "Task created successfully" }, { status: 201 });
            }
        }

        const query = `
        INSERT INTO task(
            assigned_to, status, task_name, type, created_at
        )
        VALUES ($1, $2, $3, $4, NOW()) 
    `;

        const values = [assigned_to, status, taskName, type];
        await pool.query(query, values);
        return NextResponse.json({ message: "Task created successfully" }, { status: 201 });



    } catch (error) {
        console.error("Error inserting task data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}



export async function GET(req) {


    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const user = searchParams.get("user")

    let queryParams = []

    try {
        let query = `
     SELECT 
    t.*, 
    u.id AS user_id, 
    u.name AS assigned_to_name,
    u.email AS assigned_to_email
FROM task t
INNER JOIN users u ON t.assigned_to = u.id
    `;

        if (start_date && end_date) {
            query += ` WHERE t.created_at BETWEEN $1 AND $2`;
            queryParams.push(start_date, end_date);
        }
        if (user) {
            query += ` AND t.assigned_to = $3`;
            queryParams.push(user);
        }
        query += ` ORDER BY t.created_at DESC;`;
        const result = await pool.query(query, queryParams);
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}



export const revalidate = 0
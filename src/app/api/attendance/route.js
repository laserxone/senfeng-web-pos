import pool from "@/config/db";
import { NextResponse } from "next/server"
import moment from "moment";
import admin from "@/lib/firebaseAdmin";

// export async function POST(req) {
//     const { data } = await req.json();
//     const client = await pool.connect();

//     try {
//         for (const item of data) {
//             // Lookup user ID using email
//             const userQuery = `SELECT id FROM users WHERE email = $1`;
//             const userResult = await client.query(userQuery, [item.attendanceBy]);
//             let userId = userResult.rows.length ? userResult.rows[0].id : null;

//             const query = `
//                 INSERT INTO attendance(
//                     user_id, time_in, time_out, image_time_in, image_time_out, 
//                     location_time_in, location_time_out, note_time_in, note_time_out
//                 )
//                 VALUES (
//                     $1, TO_TIMESTAMP($2 / 1000.0), TO_TIMESTAMP($3 / 1000.0), $4, $5, 
//                     $6, $7, $8, $9
//                 )
//             `;

//             const values = [
//                 userId,
//                 Number(item.timeIn),
//                 item.timeOut ? Number(item.timeOut) : null, // Convert if exists, else null
//                 item.imageTimeIn || "", // Default to empty string
//                 item.imageTimeOut || "", // Default to empty string
//                 Array.isArray(item.locationTimeIn) ? item.locationTimeIn : [], // Default to empty array
//                 Array.isArray(item.locationTimeOut) ? item.locationTimeOut : [], // Default to empty array
//                 item.noteTimeIn || "", // Default to empty string
//                 item.noteTimeOut || "" // Default to empty string
//             ];

//             await client.query(query, values);
//         }

//         console.log("Attendance data inserted successfully");
//     } catch (error) {
//         console.error("Error inserting attendance data:", error);
//     } finally {
//         client.release();
//     }

//     return NextResponse.json({ message: "done" }, { status: 200 });
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
        INSERT INTO attendance (${fields.join(", ")})
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


export async function GET(req) {

    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const user = searchParams.get("user")


    try {
        let query = `
        SELECT 
            t.*, 
            u.id AS user_id, 
            u.name AS user_name,
            u.email AS user_email
        FROM attendance t
        INNER JOIN users u ON t.user_id = u.id
    `;

        const queryParams = [];

        if (start_date && end_date) {
            query += ` WHERE t.time_in BETWEEN $1 AND $2`;
            queryParams.push(start_date, end_date);
        }

        if (user) {
            query += ` AND t.user_id = $3`
            queryParams.push(user);
        }

        query += ` ORDER BY t.time_in DESC;`;

        const result = await pool.query(query, queryParams);

        const db = admin.firestore();

        const processedStartDate = moment(start_date).startOf("day")
        const processedEndDate = moment(end_date).endOf("day")

        let snapshot
        if (!user) {
            snapshot = await db.collection("EmployeeAttendance")
                .where("timeIn", ">=", processedStartDate.valueOf())
                .where("timeIn", "<=", processedEndDate.valueOf())
                .get();

        } else {
            const userResult = await pool.query(`SELECT email FROM users WHERE id = $1`, [user])
            if (userResult.rows.length > 0) {
                const userEmail = userResult.rows[0].email
                snapshot = await db.collection("EmployeeAttendance")
                    .where("timeIn", ">=", processedStartDate.valueOf())
                    .where("timeIn", "<=", processedEndDate.valueOf())
                    .where("attendanceBy", '==', userEmail)
                    .get();
            }
        }

        const attendanceRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const preparedData = attendanceRecords.map((item) => {
            return {
                time_in: item?.timeIn ? moment(item?.timeIn).utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null,
                note_time_in: item?.noteTimeIn || null,
                location_time_in: item?.locationTimeIn || [],
                image_time_in: item?.imageTimeIn || null,
                time_out: item?.timeOut ? moment(item?.timeOut).utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null,
                note_time_out: item?.noteTimeOut || null,
                location_time_out: item?.locationTimeOut || [],
                image_time_out: item?.imageTimeOut || null,
                user_email: item?.attendanceBy || null
            }
        })

        const userQuery = await pool.query(`SELECT name, email FROM users`)


        const userMap = {};
        userQuery.rows.forEach(user => {
            userMap[user.email] = user.name;
        });

        const enrichedData = preparedData.map(item => ({
            ...item,
            user_name: userMap[item.user_email] || "Unknown"
        }));

        const finalData = [...result.rows, ...enrichedData]

        finalData.sort((a, b) => new Date(b.time_in) - new Date(a.time_in))

        const uniqueData = [];
        const seenDates = new Set();

        finalData.forEach(item => {
            const formattedDate = moment(item.time_in).format("DD-MM-YYYY");
            if (!seenDates.has(formattedDate)) {
                seenDates.add(formattedDate);
                uniqueData.push(item);
            }
        });


        return NextResponse.json(uniqueData, { status: 200 })



    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}


export const revalidate = 0
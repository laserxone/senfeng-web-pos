
import pool from "@/config/db";
import { storage } from "@/config/firebase";
import admin from "@/lib/firebaseAdmin";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import moment from "moment";
import { NextResponse } from "next/server";


export async function GET(req, { params }) {
    const { id } = await params
    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date') 

    if (!id) {
        return NextResponse.json({ message: "Parameters missing" }, { status: 404 })
    }

    try {
        let query = `
    SELECT 
    t.*, 
    u.id AS user_id, 
    u.name AS user_name,
    u.email AS user_email
FROM attendance t
INNER JOIN users u ON t.user_id = u.id
WHERE u.id = $1
    `;
        const queryParams = [id];

        if (start_date && end_date) {
            query += ` AND t.time_in BETWEEN $2 AND $3`;
            queryParams.push(start_date, end_date);
        }

        query += ` ORDER BY t.time_in DESC;`;
        const result = await pool.query(query, queryParams);

        const db = admin.firestore();

        const processedStartDate = moment(start_date).startOf("day")
        const processedEndDate = moment(end_date).endOf("day")


        let snapshot
        if (id) {
            const userResult = await pool.query(`SELECT email FROM users WHERE id = $1`, [id])
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

        const finalData = [...result.rows, ...preparedData]

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
        console.error('message: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}


export async function POST(req, { params }) {
    try {
        const { id } = await params
        const { note, location, image, type, task, reason } = await req.json();

        if (!note || !location || !image) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const currentDate = moment().format("YYYY-MM-DD"); // Format the date
        const timestamp = new Date(); // Current time

        // Check if an attendance entry exists for the same date
        const checkQuery = `
        SELECT * FROM attendance 
        WHERE user_id = $1 
        AND DATE(time_in) = $2
      `;
        const checkResult = await pool.query(checkQuery, [id, currentDate]);
        const fileName = `${id}/attendance/${moment().valueOf()}.png`; // Unique file path


        if (checkResult.rows.length === 0) {
            await UploadImageForMobile(image, fileName)
            const insertQuery = `
          INSERT INTO attendance (user_id, note_time_in, time_in, location_time_in, image_time_in)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
        `;
            const insertResult = await pool.query(insertQuery, [id, note, timestamp, location, fileName]);

            await pool.query(`
            INSERT INTO task(
                assigned_to, status, task_name, type, created_at
            )
            VALUES ($1, $2, $3, $4, NOW()) 
        `, [id, "Pending", task, reason]);

            return NextResponse.json({ message: "Attendance marked time in", data: insertResult.rows[0] }, { status: 201 });
        }

        const existingAttendance = checkResult.rows[0];

        if (!existingAttendance.time_out) {
            await UploadImageForMobile(image, fileName)
            const updateQuery = `
          UPDATE attendance 
          SET note_time_out = $1, time_out = $2, location_time_out = $3, image_time_out = $4
          WHERE id = $5
          RETURNING *;
        `;
            const updateResult = await pool.query(updateQuery, [note, timestamp, location, fileName, existingAttendance.id]);

            // await pool.query(`
            //     INSERT INTO task(
            //         assigned_to, status, task_name, type, created_at
            //     )
            //     VALUES ($1, $2, $3, $4, NOW()) 
            // `, [id, "Pending", task, reason]);

            return NextResponse.json({ message: "Attendance marked time out", data: updateResult.rows[0] }, { status: 200 });
        }

        return NextResponse.json({ message: "Attendance already marked for the day" }, { status: 400 });

    } catch (error) {
        console.log("message:", error);
        return NextResponse.json({ message: error?.message || "Something went wrong" }, { status: 500 });
    }
}


async function UploadImageForMobile(image, fileName) {
    return new Promise(async (resolve, reject) => {
        try {

            const storageRef = ref(storage, fileName);

            await uploadString(storageRef, image, "base64", { contentType: "image/png" });

            resolve(true);
        } catch (error) {
            console.log(error)
            reject(null)
        }

    })

}
export const revalidate = 0
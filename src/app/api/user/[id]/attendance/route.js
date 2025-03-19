
import pool from "@/config/db";
import { db, storage } from "@/config/firebase";
import { UploadImage } from "@/lib/uploadFunction";
import { getDownloadURL, getStorage, ref, uploadBytes, uploadString } from "firebase/storage";
import moment from "moment";
import { NextResponse } from "next/server"


export async function GET(req, { params }) {
    const { id } = await params
    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    console.log(start_date, end_date, id)

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
        return NextResponse.json(result.rows, { status: 200 });

    } catch (error) {
        console.error('Error: ', error);
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

            return NextResponse.json({ message: "Attendance marked (time_in)", data: insertResult.rows[0] }, { status: 201 });
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

            await pool.query(`
                INSERT INTO task(
                    assigned_to, status, task_name, type, created_at
                )
                VALUES ($1, $2, $3, $4, NOW()) 
            `, [id, "Pending", task, reason]);

            return NextResponse.json({ message: "Attendance marked (time_out)", data: updateResult.rows[0] }, { status: 200 });
        }

        return NextResponse.json({ message: "Attendance already marked for the day" }, { status: 400 });

    } catch (error) {
        console.log("Error:", error);
        return NextResponse.json({ message: error?.message || "Something went wrong" }, { status: 500 });
    }
}


async function UploadImageForMobile(image, fileName) {
    return new Promise(async (resolve, reject) => {
        try {
          
            const storageRef = ref(storage, fileName);

            await uploadString(storageRef, image, "base64", { contentType: "image/png" });

           
            const imageUrl = await getDownloadURL(storageRef); // Get image URL
            resolve(imageUrl);
        } catch (error) {
            console.log(error)
            reject(null)
        }

    })

}
export const revalidate = 0
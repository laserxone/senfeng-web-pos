

import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import moment from "moment";
import { NextResponse } from "next/server"

export async function GET(req, { params }) {


    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start')
    const end_date = searchParams.get('end')
    const user = searchParams.get('user')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const salaryQuery = `
        SELECT * FROM salaries WHERE user_id = $1 AND month = $2 AND year = $3
    `;
    const salaryResult = await pool.query(salaryQuery, [user, month, year]);


    try {
        const reimbursement = await pool.query(`
        SELECT 
          r.*, 
          u.id AS user_id, 
          u.name AS submitted_by_name
        FROM reimbursement r
        INNER JOIN users u ON r.submitted_by = u.id
        WHERE r.date BETWEEN $1 AND $2 AND submitted_by = $3 ORDER BY r.date ASC;
      `, [start_date, end_date, user]);

        const db = admin.firestore();

        const processedStartDate = moment(start_date).startOf("day")
        const processedEndDate = moment(end_date).endOf("day")

        let snapshot

        const userResult = await pool.query(`SELECT email FROM users WHERE id = $1`, [user])
        if (userResult.rows.length > 0) {
            const userEmail = userResult.rows[0].email
            snapshot = await db.collection("EmployeeAttendance")
                .where("timeIn", ">=", processedStartDate.valueOf())
                .where("timeIn", "<=", processedEndDate.valueOf())
                .where("attendanceBy", '==', userEmail)
                .get();
        }

        const attendanceRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const preparedData = attendanceRecords.map((item) => {
            return {
                time_in: item?.timeIn,
                note_time_in: item?.noteTimeIn || null,
                location_time_in: item?.locationTimeIn || [],
                image_time_in: item?.imageTimeIn || null,
                time_out: item?.timeOut,
                note_time_out: item?.noteTimeOut || null,
                location_time_out: item?.locationTimeOut || [],
                image_time_out: item?.imageTimeOut || null,
                user_email: item?.attendanceBy || null
            }
        })


        const userQuery = await pool.query(`SELECT id, name, email, basic_salary, total_salary, monthly_target FROM users WHERE id = $1`, [user])


        const userMap = {};
        userQuery.rows.forEach(user => {
            userMap[user.email] = user.name;
        });

        const enrichedData = preparedData.map(item => ({
            ...item,
            user_name: userMap[item.user_email] || "Unknown"
        }));

        const finalData = [...enrichedData]

        finalData.sort((a, b) => new Date(a.time_in) - new Date(b.time_in))

        const commissionQuery = `SELECT * FROM commissions WHERE user_id = $1 AND approval_date BETWEEN $2 AND $3 `;
        const commissionResult = await pool.query(commissionQuery, [user, start_date, end_date]);

       

        return NextResponse.json({
            reimbursement: reimbursement.rows,
            attendance: finalData,
            user: userQuery.rows[0],
            salary: salaryResult.rows.length > 0 ? salaryResult.rows[0] : null,
            commission: commissionResult.rows || []
        }, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}

export async function POST(req) {
    try {
        const data = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ error: "No data provided for insertion" }, { status: 400 });
        }

        const { user_id, month, year, ...otherFields } = data;

        if (!user_id || !month || !year) {
            return NextResponse.json({ error: "Missing user_id, month, or year" }, { status: 400 });
        }

        // Check if record exists
        const checkQuery = `SELECT id FROM salaries WHERE user_id = $1 AND month = $2 AND year = $3`;
        const checkResult = await pool.query(checkQuery, [user_id, month, year]);

        if (checkResult.rows.length > 0) {
            // Record exists, update it
            const setClause = Object.keys(otherFields)
                .map((key, index) => `${key} = $${index + 4}`)
                .join(", ");

            const updateQuery = `
                UPDATE salaries 
                SET ${setClause}
                WHERE user_id = $1 AND month = $2 AND year = $3
            `;

            await pool.query(updateQuery, [user_id, month, year, ...Object.values(otherFields)]);

            return NextResponse.json({ message: "Salary record updated successfully" }, { status: 200 });
        } else {
            // Insert new record
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

            const insertQuery = `
                INSERT INTO salaries (${fields.join(", ")})
                VALUES (${placeholders})
            `;

            await pool.query(insertQuery, values);

            return NextResponse.json({ message: "Salary record inserted successfully" }, { status: 201 });
        }
    } catch (error) {
        console.error("Error inserting/updating data: ", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export const revalidate = 0
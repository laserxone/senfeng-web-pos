import pool from "@/config/db";
import { NextResponse } from "next/server"



export async function GET(req) {

    try {
     // Step 1: Get all users from the users table
     const usersQuery = 'SELECT id, name FROM users';
     const usersResult = await pool.query(usersQuery);
     const users = usersResult.rows;
 
     // Step 2: For each user, check the latest attendance record
     const result = [];
 
     for (const user of users) {
       const userId = user.id;
       const attendanceQuery = `
         SELECT *
         FROM attendance
         WHERE user_id = $1
         ORDER BY time_in DESC
         LIMIT 1;
       `;
       
       // Fetch the latest attendance record for the user
       const attendanceResult = await pool.query(attendanceQuery, [userId]);
 
       if (attendanceResult.rows.length > 0) {
         const attendance = attendanceResult.rows[0];
 
         // Check if time_out exists, otherwise fallback to location_time_in
         if (attendance.time_out) {
           result.push({
             user_name: user.name,
             location: attendance.location_time_out,
             id : user.id
           });
         } else if (attendance.time_in) {
           result.push({
             user_name: user.name,
             location: attendance.location_time_in,
             id  : user.id
           });
         }
       }
     }
 
    
        return NextResponse.json(result, { status: 200 })

    } catch (error) {
        console.error('Error ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }
}

export const revalidate = 0
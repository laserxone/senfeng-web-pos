import pool from "@/config/db";
import { NextResponse } from "next/server"
import { storage } from "@/config/firebase";
import admin from "@/lib/firebaseAdmin";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import moment from "moment";



export async function GET(req, { params }) {


    const { id } = await params
    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    try {
        let query = `
    SELECT 
    r.*, 
    u.id AS user_id, 
    u.name AS user_name,
    c.name AS customer_name,
    c.owner AS customer_owner,
    c.location AS customer_location,
    c.number AS customer_number,
    c.member AS customer_member,
    c.id AS customer_id
FROM visit r
INNER JOIN users u ON r.user_id = u.id
INNER JOIN customer c ON r.customer_id = c.id
WHERE u.id = $1
    `;

        const queryParams = [id];

        if (start_date && end_date) {
            query += ` AND r.created_at BETWEEN $2 AND $3`;
            queryParams.push(start_date, end_date);
        }

        query += ` ORDER BY r.created_at DESC;`;
        const result = await pool.query(query, queryParams);
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}

export async function POST(req, { params }) {
    try {
      const data = await req.json();
      const { id } = await params;
  
      if (!data || Object.keys(data).length === 0) {
        return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
      }
  
      if (data.signature) {
        const fileName = `${id}/signature/${Date.now()}.png`;
        await UploadImageForMobile(data.signature, fileName);
        data.signature = fileName; 
      }
  
      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");
  
      const query = `
        INSERT INTO visit (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *;
      `;
  
      const { rows } = await pool.query(query, values);
      const newData = rows[0];
  
      // Get user name
      const userQuery = `SELECT name FROM users WHERE id = $1;`;
      const userResult = await pool.query(userQuery, [id]);
      const user_name = userResult.rows.length > 0 ? userResult.rows[0].name : null;
  
      return NextResponse.json({ ...newData, user_name }, { status: 200 });
  
    } catch (error) {
      console.error('Error inserting data: ', error);
      return NextResponse.json({ message: 'Error adding customer' }, { status: 500 });
    }
  }
  

async function UploadImageForMobile(image, fileName) {
    const base64 = image.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
    return new Promise(async (resolve, reject) => {
        try {

            const storageRef = ref(storage, fileName);

            await uploadString(storageRef, base64, "base64", { contentType: "image/png" });
            resolve(true);
        } catch (error) {
            console.log(error)
            reject(null)
        }

    })

}

export const revalidate = 0
import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import moment from "moment";
import { NextResponse } from "next/server";


export async function DELETE(req, { params }) {
  try {

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    await pool.query(`DELETE FROM reimbursement WHERE id = $1`, [id]);


    return NextResponse.json({ message: "Customer Deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const data = await req.json();
    const { ...updates } = data;
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json({ error: "No valid data provided for update" }, { status: 400 });
    }

    values.push(id); // Add ID as the last parameter for WHERE clause
    const query = `
          UPDATE commissions 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
          RETURNING *
      `;

    const response = await pool.query(query, values);


     // Step 2: Get applicant user info
     const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [response.rows[0].user_id]);
     const email = userResult.rows[0]?.email;

    

     // Step 4: Add notifications to Firestore
     const timestamp = moment().valueOf();

     const notification = {
         TimeStamp: timestamp,
         page: "commission",
         read: false,
         title: `Your commission is approved`,
         sendTo: email,
     }

     const db = admin.firestore();
     const docRef = db.collection("Notification").doc(); // Creating a new document reference
     await docRef.set(notification); // Set the notification document

    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const revalidate = 0
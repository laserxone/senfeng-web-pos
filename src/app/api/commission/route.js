import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import moment from "moment";
import { NextResponse } from "next/server"



export async function POST(req) {

    try {
        const data = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO commissions (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

        const { rows } = await pool.query(query, values);

        // Step 2: Get applicant user info
        const userResult = await pool.query("SELECT name FROM users WHERE id = $1", [data.user_id]);
        const userName = userResult.rows[0]?.name || "Someone";

        // Step 3: Get all owners
        const ownersResult = await pool.query(
            "SELECT id FROM users WHERE designation = 'Owner'"
        );
        const ownerIds = ownersResult.rows.map((owner) => owner.id);

        // Step 4: Add notifications to Firestore
        const timestamp = moment().valueOf();

        const notifications = ownerIds.map((eachId) => ({
            TimeStamp: timestamp,
            page: "commission",
            read: false,
            title: `${userName} applied for commission`,
            sendTo: eachId,
        }));

        const db = admin.firestore();
        const batch = db.batch();

        notifications.forEach((notification) => {
            const docRef = db.collection("Notification").doc();
            batch.set(docRef, notification);
        });

        await batch.commit();


        return NextResponse.json({
            message: "Data added successfully",
        }, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding Data' }, { status: 500 })
    }
}


export async function GET(req, { params }) {

    try {
        const query = `
      SELECT 
        commissions.*, 
        users.name AS user_name,
        sale.serial_no AS machine_name,
        customer.id AS customer_id,
        customer.name AS customer_name,
        customer.owner AS customer_owner
      FROM 
        commissions
      LEFT JOIN users ON commissions.user_id = users.id
      LEFT JOIN sale ON commissions.sale_id = sale.id
      LEFT JOIN customer AS customer ON sale.customer_id = customer.id
      ORDER BY commissions.created_at DESC
    `;

        const { rows } = await pool.query(query);

        return NextResponse.json(rows, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { message: "Failed to fetch commissions", details: err.message },
            { status: 500 }
        );
    }
}


export const revalidate = 0
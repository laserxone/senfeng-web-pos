import pool from "@/config/db";
import { auth } from "@/config/firebase";
import admin from "@/lib/firebaseAdmin";
import { sendPasswordResetEmail } from "firebase/auth";
import { NextResponse } from "next/server"


// export async function POST(req) {
//     const { data } = await req.json()
//     const client = await pool.connect();

//     try {
//       for (const item of data) {
//         const query = `
//           INSERT INTO users (
//             basic_salary,
//             branch_expenses_assigned,
//             branch_expenses_delete_access,
//             branch_expenses_write_access,
//             designation,
//             dp,
//             email,
//             inventory_assigned,
//             monthly_target,
//             name,
//             token,
//             total_salary,
//             old_ref
//           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
//           RETURNING *;
//         `;

//         const values = [
//           Number(item.basicSalary || 0),
//           item.branchExpensesAssigned || false,
//           item.branchExpensesDeleteAccess || false,
//           item.branchExpensesWriteAccess || false,
//           item.designation,
//           item.dp || "",
//           item.email,
//           item.inventoryAssigned || false,
//           Number(item.monthlyTarget),
//           item.name,
//           item.token || null, // Token is optional, set null if not present
//           Number(item.totalSalary || 0),
//           item.id, // Old ref
//         ];

//         const res = await client.query(query, values);
//         console.log("Inserted:", res.rows[0]);
//       }
//     } catch (error) {
//       console.error("Error inserting data:", error);
//     } finally {
//       client.release(); // Release client back to pool
//     }

//     return NextResponse.json({message : 'done'}, {status : 200})
// }


export async function POST(req) {

  try {
    const data = await req.json();

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
    }

    const { email } = data;

    const checkEmail = await pool.query(`SELECT id FROM users WHERE email = $1`, [email])
    if (checkEmail.rows.length != 0) {
      return NextResponse.json({ message: "Email already exists in the system" }, { status: 400 })
    }

    const password = "1234qwer!@#";

    try {
      await admin.auth().createUser({
        email,
        password,
      });
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.warn(`Email ${email} already exists in Firebase, continuing...`);
      } else {
        throw error;
      }
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
      INSERT INTO users (${fields.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    const newUser = rows[0];

    sendPasswordResetEmail(auth, email, {
      url: "https://senfeng-web.vercel.app/login"
    })

    return NextResponse.json(newUser, { status: 200 });

  } catch (error) {
    console.error('Error inserting data: ', error);
    return NextResponse.json({ message: error?.message || 'Error adding user' }, { status: 500 });
  }
}

export async function GET(req) {

  const searchParams = req.nextUrl.searchParams
  const user = searchParams.get('user')


  try {
    let query = `SELECT * FROM users`;

    let queryParams = []

    if (user) {
      query += ` WHERE id = $1`
      queryParams.push(user)
    }

    query += ` ORDER BY name ASC;`;

    const result = await pool.query(query, queryParams);
    return NextResponse.json(result.rows, { status: 200 })

  } catch (error) {
    console.error('Error inserting data: ', error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
  }

}


export const revalidate = 0
import pool from "@/config/db";
import { NextResponse } from "next/server"


export async function POST(req) {
    const { data } = await req.json()
    const client = await pool.connect();

    try {
      for (const item of data) {
        const query = `
          INSERT INTO users (
            basic_salary,
            branch_expenses_assigned,
            branch_expenses_delete_access,
            branch_expenses_write_access,
            designation,
            dp,
            email,
            inventory_assigned,
            monthly_target,
            name,
            token,
            total_salary,
            old_ref
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *;
        `;
  
        const values = [
          Number(item.basicSalary || 0),
          item.branchExpensesAssigned || false,
          item.branchExpensesDeleteAccess || false,
          item.branchExpensesWriteAccess || false,
          item.designation,
          item.dp || "",
          item.email,
          item.inventoryAssigned || false,
          Number(item.monthlyTarget),
          item.name,
          item.token || null, // Token is optional, set null if not present
          Number(item.totalSalary || 0),
          item.id, // Old ref
        ];
  
        const res = await client.query(query, values);
        console.log("Inserted:", res.rows[0]);
      }
    } catch (error) {
      console.error("Error inserting data:", error);
    } finally {
      client.release(); // Release client back to pool
    }

    return NextResponse.json({message : 'done'}, {status : 200})
}

export async function GET(req) {

  try {
      const query = `
    SELECT * FROM users ORDER BY name ASC
  `;

      const result = await pool.query(query);
      return NextResponse.json(result.rows, { status: 200 })

  } catch (error) {
      console.error('Error inserting data: ', error);
      return NextResponse.json({message : error.message || "Something went wrong"}, { status: 500 })
  }

}


export const revalidate = 0
import pool from "@/config/db";
import { sendNotification } from "@/lib/sendNotification";
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
        INSERT INTO customer (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;



        const result = await pool.query(query, values);

        console.log("data inserted successfully");
        if (result.rows[0].ownership) {
            sendNotification(`${result.rows[0]?.owner || result.rows[0]?.name} assigned to you`, `${result.rows[0].member ? "member" : "customer"}/detail?id=${result.rows[0].id}`, result.rows[0].ownership)
        }

        return NextResponse.json({ message: "Inserted successfully", data: result.rows[0] }, { status: 201 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}


// export async function POST(req) {
//     const { data } = await req.json()
//     const client = await pool.connect();



//     try {
//         for (const item of data) {
//             const query = `
//           INSERT INTO customer(
//                     name, email, customer_group, industry, location, number, owner, ownership, old_ref, created_at
//                 )
//                 VALUES(
//                     $1, $2, $3, $4, $5, $6, $7, $8, $9, TO_TIMESTAMP($10 / 1000.0)
//                 )
//           `;
//             const values = [
//                 item.company, // name
//                 item.email,    // email
//                 item.group,    // group
//                 item.industry, // industry
//                 item.location, // location
//                 item.number,   // number
//                 item.owner,    // owner
//                 null,
//                 item.id,       // old_ref
//                 Number(item.TimeStamp) // created_at (in milliseconds)
//             ];

//             await client.query(query, values);
//             console.log(item.company, "done")
//         }

//         console.log('Customer data inserted successfully');
//     } catch (error) {
//         console.error('Error inserting data: ', error);
//     } finally {
//         client.release()
//     }



//     return NextResponse.json({ message: 'done' }, { status: 200 })
// }

export async function GET(req) {

    const searchParams = req.nextUrl.searchParams
    const urlQuery = searchParams.get('withoutsale')
    try {
        if (urlQuery) {

            const result = await pool.query(`SELECT * FROM customer ORDER BY name ASC`)
            return NextResponse.json(result.rows, { status: 200 });
        }
        else {
            const customerQuery = await pool.query(`SELECT * FROM customer ORDER BY name ASC`);
            const customers = customerQuery.rows;

            if (customers.length === 0) {
                return NextResponse.json({ customers: [] }, { status: 200 });
            }

            // Extract customer IDs
            const customerIds = customers.map((customer) => customer.id);

            // Fetch all sales related to the customers
            const salesQuery = await pool.query(
                `SELECT * FROM sale WHERE customer_id = ANY($1)`,
                [customerIds]
            );
            const sales = salesQuery.rows;

            // Map sales back to their respective customers
            const customersWithSales = customers.map((customer) => ({
                ...customer,
                sales: sales.filter((sale) => sale.customer_id === customer.id),
            }));

            return NextResponse.json(customersWithSales, { status: 200 });
        }

    } catch (error) {
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }
}

export const revalidate = 0
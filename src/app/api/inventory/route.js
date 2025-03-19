import pool from "@/config/db";
import { NextResponse } from "next/server"

// export async function POST(req) {

//     const { data } = await req.json();

//     try {
//         for (const item of data) {

//             const query = `
//                 INSERT INTO inventory(
//                     name, price, qty, rack, threshold, new_order, chinese_name, remarks, unit
//                 )
//                 VALUES (
//                     $1, $2, $3, $4, $5, $6, $7, $8, $9
//                 )
//             `;

//             const values = [
//                 item.name,
//                 item.price,
//                 item.qty,
//                 item.rack,
//                 item.threshold,
//                 item.new_order,
//                 item.chinese_name,
//                 item.remarks,
//                 item.unit
//             ];

//             await pool.query(query, values);
//         }

//         console.log('Inventory data inserted successfully');
//     } catch (error) {
//         console.error('Error inserting reimbursement data:', error);
//     }



//     return NextResponse.json({ message: 'done' }, { status: 200 })
// }


export async function POST(req) {

    try {
        const data = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ error: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO inventory (${fields.join(", ")})
        VALUES (${placeholders})
    `;

        await pool.query(query, values);

        console.log("data inserted successfully");
        return NextResponse.json({ message: "Inserted successfully" }, { status: 201 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}

export async function PUT(req) {
    try {
        const data = await req.json();
        const { id, ...updates } = data;
        
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
            UPDATE inventory 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `;

        await pool.query(query, values);

        console.log("Inventory data updated successfully");
        return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating inventory data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}




export const revalidate = 0
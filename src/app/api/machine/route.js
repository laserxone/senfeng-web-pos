import pool from "@/config/db";
import { NextResponse } from "next/server"


// export async function POST(req) {
//     const { data } = await req.json()
//     const client = await pool.connect();



//     try {
//         for (const customer of data) {
//             if (customer.machines.length > 0) {
//                 for (const machine of customer.machines) {
                   

//                     let customerId = null;
//                     if (machine.clientID) {

//                         const customerQuery = `
//                             SELECT id FROM customer WHERE old_ref = $1
//                         `;
//                         const customerResult = await client.query(customerQuery, [machine.clientID]);

//                         if (customerResult.rows.length > 0) {
                          
//                             customerId = customerResult.rows[0].id; // Get the customer id if found
//                             console.log(customerId)
//                         } 
//                     }

//                     const saleQuery = `
//                         INSERT INTO sale (
//                             customer_id, created_at, type, speed_money_note, speed_money,
//                             sell_by, commission, name, order_no, price, serial_no,
//                             contract_images_png, contract_images_pdf, other_images_pdf,
//                             other_images_png, old_ref
//                         )
//                         VALUES (
//                             $1, TO_TIMESTAMP($2 / 1000.0), $3, $4, $5, $6, $7, $8, $9, $10, $11,
//                             $12, $13, $14, $15, $16
//                         ) RETURNING id
//                     `;
//                     const values = [
//                         customerId,                // customer_id
//                         Number(machine.TimeStamp),           // created_at
//                         machine.type,                // type
//                         machine.speedMoneyNote || "",      // speed_money_note
//                         machine.speedMoney || false,          // speed_money
//                         null,                        // sell_by (null initially, will be updated below if found)
//                         machine.commission || false,         // commission
//                         machine.name || "",                // name
//                         machine.orderNo || "",             // order_no
//                         Number(machine.price),       // price (convert to Number)
//                         machine.serialNo || "",            // serial_no
//                         machine.contractImages || [],      // contract_images_png
//                         machine.contractPdf || [],         // contract_images_pdf
//                         machine.otherPdf || [],            // other_images_pdf
//                         machine.otherImages || [],         // other_images_png
//                         machine.id                   // old_ref
//                     ];

//                     let result
//                     try {
//                         result = await client.query(saleQuery, values);
//                     } catch (error) {
//                         console.log("machine error", error)
//                     }

                    
//                     const saleId = result.rows[0].id;

//                     // If `sellBy` exists and found in users table, update `sell_by` in sale table
//                     if (machine.sellBy) {
//                         const userQuery = `
//                             SELECT id FROM users WHERE old_ref = $1
//                         `;
//                         const userResult = await client.query(userQuery, [machine.sellBy]);
//                         if (userResult.rows.length > 0) {
//                             const userId = userResult.rows[0].id;
//                             const updateSellByQuery = `
//                                 UPDATE sale SET sell_by = $1 WHERE id = $2
//                             `;
//                             await client.query(updateSellByQuery, [userId, saleId]);
//                         }
//                     }

//                     // Insert machine's payments into payment table
//                     for (const payment of machine.payments) {
                        
//                         const paymentQuery = `
//                             INSERT INTO payment (
//                                 transaction_date, amount, image, mode, note,
//                                 clearance_date, received_by, machine_id
//                             )
//                             VALUES (
//                                 TO_TIMESTAMP($1 / 1000.0), $2, $3, $4, $5,
//                                 TO_TIMESTAMP($6 / 1000.0), $7, $8
//                             )
//                         `;
//                         const paymentValues = [
//                             Number(payment.TimeStamp),           // transaction_date
//                             Number(payment.amount),      // amount
//                             payment.images || "",              // image
//                             payment.mode || "",                // mode
//                             payment.note || "",                // note
//                             payment.receivingDate ? Number(payment.receivingDate) : null,       // clearance_date
//                             payment.receivedBy || "",          // received_by
//                             saleId                       // machine_id (from the sale table)
//                         ];
//                         try {
//                             await client.query(paymentQuery, paymentValues)
//                             console.log(payment.note, "done")
//                         } catch (error) {
//                             console.log("payment message: ", error)
//                         }

//                     }

//                     console.log(machine.orderNo, "done")
//                 }
//             }
//         }

//         console.log('Sale and Payment data inserted successfully');
//     } catch (error) {
//         console.log('Error inserting data: ', error);
//     } finally {
//         await client.end(); // Close the connection
//     }



//     return NextResponse.json({ message: 'done' }, { status: 200 })
// }


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
        INSERT INTO sale (${fields.join(", ")})
        VALUES (${placeholders})
    `;

        await pool.query(query, values);
        if (data?.customer_id)
            await pool.query(`UPDATE customer SET member = TRUE WHERE id = $1`, [data.customer_id])

        console.log("data inserted successfully");
        return NextResponse.json({ message: "Inserted successfully" }, { status: 201 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}

export const revalidate = 0
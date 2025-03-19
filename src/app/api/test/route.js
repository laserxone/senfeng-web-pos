import pool from "@/config/db";
import { NextResponse } from "next/server";


export async function POST(req) {
    const { data } = await req.json()
    try {
        for (const item of data) {
            // Ensure the required fields exist, default to empty string if missing
            const location = item["City"] || "";
            const name = item["Company Name"] || "";
            const email = item["EMAIL"] || "";
            const owner = item["Name"] || "";
            const ownership = item["Salesperson"] || "";
            let number = item["Number"] || "";

            number = String(number);

            // Split "Number" field by "/"
            let numbersArray = number.split("/").map(num => num.trim());

            // Ensure each number starts with '0'
            numbersArray = numbersArray.map(num => (num.startsWith("0") ? num : "0" + num));

            // console.log(numbersArray)

            // Insert data into the PostgreSQL customer table
            await pool.query(
                `INSERT INTO customer (location, name, email, owner, number) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [location, name, email, owner, numbersArray]
            );

            console.log(name, owner, "saved")
        }
        return NextResponse.json({ message: "Done" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error }, { status: 500 })
    }
}
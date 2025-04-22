import pool from "@/config/db";
import { NextResponse } from "next/server";



export async function GET(req, { params }) {
    try {
        const { id } = await params
        const userId = id
        

        if (!userId) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        const searchParams = req.nextUrl.searchParams
        const employee = searchParams.get('employee')
        const access = searchParams.get("access")
              

        const topFollowupQuery = `
            SELECT DISTINCT ON (f.customer_id) f.*, c.*
            FROM feedback f
            JOIN customer c ON f.customer_id = c.id
            WHERE f.user_id = $1 AND f.type = 'feedback' AND f.top_follow = true
            ORDER BY f.customer_id, f.created_at ASC;
        `;
        const topFollowup = await pool.query(topFollowupQuery, [userId]);
        let recentCustomerQuery
        let recentCustomer

        if (employee) {
            recentCustomerQuery = `
            SELECT * FROM customer 
            WHERE ownership = $1 AND member = false;
        `;

        recentCustomer = await pool.query(recentCustomerQuery, [userId]);
        } else {
            if(access === null || access === 'false'){
               
                recentCustomerQuery = `
                SELECT * FROM customer 
                WHERE member = false;
            `;
            recentCustomer = await pool.query(recentCustomerQuery);
            } else {
               
                recentCustomerQuery = `
                SELECT * FROM customer 
                WHERE member = false AND created_by = $1;
            `;
            recentCustomer = await pool.query(recentCustomerQuery, [userId]);
            }
           
        }
        // Fetch recent customers

        

        // Fetch weekly follow-ups (Latest entry per customer)
        const weeklyFollowupQuery = `
            SELECT DISTINCT ON (f.customer_id) f.*, c.*
            FROM feedback f
            JOIN customer c ON f.customer_id = c.id
            WHERE f.user_id = $1 AND f.type = 'feedback' AND f.followup_type = 'weekly'
            ORDER BY f.customer_id, f.created_at ASC;
        `;
        const weeklyFollowup = await pool.query(weeklyFollowupQuery, [userId]);

        // Fetch monthly follow-ups (Latest entry per customer)
        const monthlyFollowupQuery = `
            SELECT DISTINCT ON (f.customer_id) f.*, c.*
            FROM feedback f
            JOIN customer c ON f.customer_id = c.id
            WHERE f.user_id = $1 AND f.type = 'feedback' AND f.followup_type = 'monthly'
            ORDER BY f.customer_id, f.created_at ASC;
        `;
        const monthlyFollowup = await pool.query(monthlyFollowupQuery, [userId]);

        return NextResponse.json({
            top_followup: topFollowup.rows,
            recent_customer: recentCustomer.rows,
            weekly: weeklyFollowup.rows,
            monthly: monthlyFollowup.rows,
        });

    } catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export const revalidate = 0
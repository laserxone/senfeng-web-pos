import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        // Get the current and last month's date range
        const currentDate = new Date();
        const firstDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        const firstDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const firstDayOfThreeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);

        // Query to get daily machine sales for the last 3 months
        const machinesSoldLast3MonthsQuery = `
          SELECT 
        s.created_at::DATE as sale_date, 
        COUNT(*) as total_machines_sold 
    FROM 
        sale s 
    WHERE 
        s.created_at >= $1 AND s.created_at <= $2
    GROUP BY sale_date
    ORDER BY sale_date;
        `;

        const machinesSoldLast3MonthsResult = await pool.query(machinesSoldLast3MonthsQuery, [
            firstDayOfThreeMonthsAgo,
            lastDayOfCurrentMonth
        ]);
        
        const salesMap = new Map(
            machinesSoldLast3MonthsResult.rows.map(row => [
                new Date(row.sale_date).toISOString().split("T")[0], // Normalize format
                row.total_machines_sold
            ])
        );
        
        const dateArray = [];
        let tempDate = new Date(firstDayOfThreeMonthsAgo);
        while (tempDate <= lastDayOfCurrentMonth) {
            const formattedDate = tempDate.toISOString().split("T")[0]; // YYYY-MM-DD format
            dateArray.push({
                date: formattedDate,
                total_machines_sold: salesMap.get(formattedDate) || 0
            });
            tempDate.setDate(tempDate.getDate() + 1); // Move to next day
        }

        const paymentQuery = `
            SELECT 
                SUM(p.amount) AS total_payment
            FROM 
                payment p
            WHERE 
                p.transaction_date BETWEEN $1 AND $2
        `;

        const machinesSoldQuery = `
            SELECT 
                COUNT(*) AS total_machines_sold
            FROM 
                sale s
            WHERE 
                s.created_at BETWEEN $1 AND $2
        `;

        // Query to get new customers added this month
        const newCustomersQuery = `
            SELECT 
                COUNT(*) AS total_new_customers
            FROM 
                customer c
            WHERE 
                c.created_at BETWEEN $1 AND $2
        `;

        // Query to get low stock items
        const lowStockQuery = `
            SELECT 
                COUNT(*) AS total_low_stock
            FROM 
                inventory
            WHERE 
                qty < 10
        `;

        // Query to get the recent 6 sales with user details
        const recentSalesQuery = `
            SELECT 
    s.price,
    s.created_at,
    s.contract_date,
    u.name AS seller_name,
    u.email AS seller_email,
    u.dp AS seller_dp,
    c.id AS customer_id,
    c.name AS customer_name,
    c.owner AS customer_owner
FROM 
    sale s
JOIN 
    users u ON u.id = s.sell_by
JOIN 
    customer c ON c.id = s.customer_id
ORDER BY 
    GREATEST(s.created_at, s.contract_date) DESC
LIMIT 5;
        `;

        const industryCount = `
        SELECT industry, COUNT(*) as customer_count
FROM customer
GROUP BY industry;
`

const feedbackQuery = `
 WITH months AS (
            SELECT TO_CHAR(date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' * generate_series(0, 11), 'YYYY-MM') AS month
        )
        SELECT 
            months.month,
            COALESCE(COUNT(CASE WHEN f.status = 'Satisfactory' THEN 1 END), 0) AS satisfactory,
            COALESCE(COUNT(CASE WHEN f.status = 'Unsatisfactory' THEN 1 END), 0) AS unsatisfactory
        FROM months
        LEFT JOIN feedback f ON TO_CHAR(f.created_at, 'YYYY-MM') = months.month
        GROUP BY months.month
        ORDER BY months.month;`;

        // Execute all queries in parallel
        const [
            paymentResult,
            machinesSoldResult,
            newCustomersResult,
            lowStockResult,
            recentSalesResult,
            industryCountResult,
            feedbackResult
        ] = await Promise.all([
            pool.query(paymentQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth]),
            pool.query(machinesSoldQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth]),
            pool.query(newCustomersQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth]),
            pool.query(lowStockQuery),
            pool.query(recentSalesQuery),
            pool.query(industryCount),
            pool.query(feedbackQuery)
        ]);

        const formattedFeedbackData = feedbackResult.rows.map(row => ({
            month: new Date(row.month + "-01").toLocaleString('en-US', { month: 'long' }),
            satisfactory: parseInt(row.satisfactory, 10),
            unsatisfactory: parseInt(row.unsatisfactory, 10)
        }));

        // Get the payment for last month
        const lastMonthPaymentResult = await pool.query(paymentQuery, [firstDayOfLastMonth, lastDayOfLastMonth]);
        const totalPaymentThisMonth = paymentResult.rows[0].total_payment || 0;
        const totalPaymentLastMonth = lastMonthPaymentResult.rows[0].total_payment || 0;

        // Get the total machines sold last month
        const lastMonthMachinesSoldResult = await pool.query(machinesSoldQuery, [firstDayOfLastMonth, lastDayOfLastMonth]);
        const totalMachinesSoldThisMonth = machinesSoldResult.rows[0].total_machines_sold || 0;
        const totalMachinesSoldLastMonth = lastMonthMachinesSoldResult.rows[0].total_machines_sold || 0;

        // Get the new customers added last month
        const lastMonthNewCustomersResult = await pool.query(newCustomersQuery, [firstDayOfLastMonth, lastDayOfLastMonth]);
        const totalNewCustomersThisMonth = newCustomersResult.rows[0].total_new_customers || 0;
        const totalNewCustomersLastMonth = lastMonthNewCustomersResult.rows[0].total_new_customers || 0;

        // Calculate percentage changes
        const paymentChangePercentage = totalPaymentLastMonth === 0
            ? 0
            : ((totalPaymentThisMonth - totalPaymentLastMonth) / totalPaymentLastMonth) * 100;

        const machinesSoldChangePercentage = totalMachinesSoldLastMonth === 0
            ? 0
            : ((totalMachinesSoldThisMonth - totalMachinesSoldLastMonth) / totalMachinesSoldLastMonth) * 100;

        const newCustomerChangePercentage = totalNewCustomersLastMonth === 0
            ? 0
            : ((totalNewCustomersThisMonth - totalNewCustomersLastMonth) / totalNewCustomersLastMonth) * 100;

        // Prepare the response data
        const responseData = {
            total_payment_this_month: totalPaymentThisMonth,
            payment_change_percentage: paymentChangePercentage.toFixed(2), // rounded to 2 decimal places
            total_machines_sold_this_month: totalMachinesSoldThisMonth,
            machines_sold_change_percentage: machinesSoldChangePercentage.toFixed(2),
            total_low_stock: lowStockResult.rows[0].total_low_stock,
            total_new_customers_this_month: totalNewCustomersThisMonth,
            new_customer_change_percentage: newCustomerChangePercentage.toFixed(2),
            recent_sales: recentSalesResult.rows.map(sale => ({
                price: sale.price,
                created_at: sale.created_at,
                seller_name: sale.seller_name,
                seller_email: sale.seller_email,
                seller_dp: sale.seller_dp,
                customer_id : sale.customer_id,
                customer_name : sale.customer_name,
                customer_owner : sale.customer_owner
            })),
            industry_count : industryCountResult.rows,
            machines_sold_last_3_months: dateArray,
            feedback_status_last_6_months : formattedFeedbackData
        };

        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 });
    }
}

export const revalidate = 0;

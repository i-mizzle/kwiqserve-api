import { Request, Response } from "express";
import * as response from '../responses'
import { calculateMetrics, getTransactionSummary, getTransactionsByChannel, listLowStockVariants, analyzeCartMetrics, analyzeStoreFrontVisits, calculateECommerceOrderMetrics, calculateReviewMetrics } from "../service/stats.service";
import { findOrders } from "../service/order.service";
import { findTransactions } from "../service/transaction.service";
import { findItems } from "../service/item.service";
// import { findCarts } from "../service/cart.service";
// import { findReviews } from "../service/review.service";
// import StoreFrontVisit from "../model/store-front-visit.model";
import puppeteer from "puppeteer";

export const statsHandler = async (req: Request, res: Response) => {
    try {
        const businessId = req.currentBusiness?._id
        const orders = await findOrders({business: businessId}, 0, 0, 'items.parentItem')
        const transactions = await findTransactions({business: businessId, order: { $exists: true }}, 0, 0, '')
        // const inventory = await findItems({business: storeId, deleted: false}, 0, 0, 'variants')
        const transactionsSummary = getTransactionSummary(transactions.data)
        const transactionsByChannel = getTransactionsByChannel(transactions.data)
        const metrics = calculateMetrics(orders.orders)
        // const lowStockVariants = listLowStockVariants(inventory.items)

        return response.ok(res, {metrics: {...metrics}, transactionsSummary, transactionsByChannel, }) 
    } catch (error: any) {
        return response.error(res, error)
    }
}

/**
* Fetch e-commerce stats if the store subscription allows it
*/
// export const eCommerceStatsHandler = async (req: Request, res: Response) => {
//   try {
//     const storeId = req.currentBusiness?._id;

//     // Fetch all carts for the store
//     const allCarts = await findCarts({ business: storeId, deleted: false }, 0, 0, '');
    
//     // Analyze cart metrics and customer segmentation
//     const cartMetrics = analyzeCartMetrics(allCarts.categories);

//     // Get e-commerce store visits
//     const storeFrontVisits = await StoreFrontVisit.find({ business: storeId }).lean();
//     const visitMetrics = analyzeStoreFrontVisits(storeFrontVisits, cartMetrics.checkedOutClientIds);

//     // Get orders with cart and calculate metrics
//     const ordersWithCart = await findOrders({ business: storeId, cart: { $exists: true, $ne: null } }, 0, 0, '');
//     const orderMetrics = calculateECommerceOrderMetrics(ordersWithCart.orders);

//     return response.ok(res, {
//       carts: {
//         total: cartMetrics.total,
//         abandoned: cartMetrics.abandoned,
//         checkedOut: cartMetrics.checkedOut,
//         abandonmentRate: cartMetrics.abandonmentRate
//       },
//       customers: cartMetrics.customers,
//       visits: {
//         uniqueVisitors: visitMetrics.uniqueVisitors,
//         totalVisits: visitMetrics.totalVisits,
//         averageVisitsPerUser: visitMetrics.averageVisitsPerUser
//       },
//       conversion: visitMetrics.conversion,
//       orders: orderMetrics.orders,
//       paymentMethods: orderMetrics.paymentMethods
//     });
//   } catch (error: any) {
//     return response.error(res, error);
//   }
// }

/**
* Fetch review stats if the store subscription allows it
*/
// export const reviewsStatsHandler = async (req: Request, res: Response) => {
//   try {
//     const storeId = req.currentBusiness?._id;

//     // Fetch all published reviews for the store with item details populated
//     const reviews = await findReviews(
//       { business: storeId, deleted: false, published: true }, 
//       0, 
//       0, 
//       'item'
//     );

//     // Calculate review metrics
//     const reviewMetrics = calculateReviewMetrics(reviews.data);

//     return response.ok(res, {
//       averageStoreRating: reviewMetrics.averageStoreRating,
//       totalReviews: reviewMetrics.totalReviews,
//       sentiments: reviewMetrics.sentiments,
//       highestRatedItem: reviewMetrics.highestRatedItem,
//       lowestRatedItem: reviewMetrics.lowestRatedItem
//     });
//   } catch (error: any) {
//     return response.error(res, error);
//   }
// }

export const exportReportPDF = async (req: Request, res: Response) => {
  try {
    const storeId = req.currentBusiness?._id
    const orders = await findOrders({business: storeId}, 0, 0, 'items.parentItem')
    const metrics = calculateMetrics(orders.orders);

    const soldItemLabels = metrics.soldItems.map((i: any) => i.name);
    const soldItemQuantities = metrics.soldItems.map((i: any) => i.quantity);
    const soldItemValues = metrics.soldItems.map((i: any) => i.salesValue);

    // Build HTML Template with charts
    const html = `
      <html>
        <head>
          <title>Business Report</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1, h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
            .metrics { margin-bottom: 40px; }
            .charts { margin: 40px 0; }
            canvas { max-width: 100%; margin: 20px auto; display: block; }
          </style>
        </head>
        <body>
          <h1>Business Report</h1>
          <h2>${new Date().toLocaleDateString()}</h2>

          <div class="metrics">
            <h3>Order Metrics</h3>
            <table>
              <tr><th>Today Orders</th><td>${metrics.todayOrdersCount}</td><td>₦${metrics.todayOrdersValue.toFixed(2)}</td></tr>
              <tr><th>This Week Orders</th><td>${metrics.thisWeekOrdersCount}</td><td>₦${metrics.thisWeekOrdersValue.toFixed(2)}</td></tr>
              <tr><th>This Month Orders</th><td>${metrics.thisMonthOrdersCount}</td><td>₦${metrics.thisMonthOrdersValue.toFixed(2)}</td></tr>
              <tr><th>Current Year Orders Value</th><td colspan="2">₦${metrics.currentYearOrdersValue.toFixed(2)}</td></tr>
            </table>
          </div>

          <div class="metrics">
            <h3>Sold Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Sales Value (₦)</th>
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                ${metrics.soldItems
                  .map(
                    (item: any) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₦${item.salesValue.toFixed(2)}</td>
                    <td>${item.image ? `<img src="${item.image}" width="40"/>` : "-"}</td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="metrics">
            <h3>Most Sold Item</h3>
            <table>
              <tr><th>Name</th><td>${metrics.mostSoldItem.name}</td></tr>
              <tr><th>Quantity</th><td>${metrics.mostSoldItem.quantity}</td></tr>
              <tr><th>Sales Value</th><td>₦${metrics.mostSoldItem.salesValue.toFixed(2)}</td></tr>
              <tr><th>Image</th><td>${metrics.mostSoldItem.image ? `<img src="${metrics.mostSoldItem.image}" width="60"/>` : "-"}</td></tr>
            </table>
          </div>

          <div class="metrics">
            <h3>Unpaid / Closed Orders</h3>
            <table>
              <tr><th>Closed Unpaid Orders</th><td>${metrics.closedUnpaidOrdersCount}</td></tr>
              <tr><th>Total Unpaid Orders Value</th><td>₦${metrics.unpaidOrdersValue.toFixed(2)}</td></tr>
            </table>
          </div>

          <div class="charts">
            <h3>Charts</h3>
            <canvas id="barChart"></canvas>
            <canvas id="pieChart"></canvas>
          </div>

          <script>
            const labels = ${JSON.stringify(soldItemLabels)};
            const quantities = ${JSON.stringify(soldItemQuantities)};
            const values = ${JSON.stringify(soldItemValues)};

            // Bar Chart - Quantities
            new Chart(document.getElementById('barChart'), {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Quantity Sold',
                  data: quantities,
                  backgroundColor: 'rgba(54, 162, 235, 0.6)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: { display: true }
                }
              }
            });

            // Pie Chart - Sales Value
            new Chart(document.getElementById('pieChart'), {
              type: 'pie',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Sales Value',
                  data: values,
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                  ],
                  borderColor: '#fff',
                  borderWidth: 1
                }]
              },
              options: { responsive: true }
            });
          </script>
        </body>
      </html>
    `;

    // Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Give charts time to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="business-report.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).send("Error generating PDF report");
  }
};

export const getTransactionSummary = (transactions: any[]) => {
  const today = new Date();
  const past10Days: Date[] = [];
  const past10Weeks: Date[] = [];
  const past10Months: Date[] = [];
  const dayTransactions: { [key: string]: any } = {};
  const weekTransactions: { [key: string]: any } = {};
  const monthTransactions: { [key: string]: any } = {};

  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    past10Days.push(date);
  }

  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - 7 * i);
    past10Weeks.push(date);
  }

  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setMonth(today.getMonth() - i);
    past10Months.push(date);
  }

  past10Days.forEach((date) => {
    const dayKey = date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    dayTransactions[dayKey] = {
      day: dayKey,
      amount: 0,
      transactionsByChannel: {},
      percentage: 0,
    };
  });

  past10Weeks.forEach((date) => {
    const weekKey = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    weekTransactions[weekKey] = {
      week: weekKey,
      amount: 0,
      transactionsByChannel: {},
      percentage: 0,
    };
  });

  past10Months.forEach((date) => {
    const monthKey = date.toLocaleString("en-US", { month: "short" });
    monthTransactions[monthKey] = {
      month: monthKey,
      amount: 0,
      transactionsByChannel: {},
      percentage: 0,
    };
  });

  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.createdAt);
    const dayKey = transactionDate.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const weekKey = `${transactionDate.getMonth() + 1}/${transactionDate.getDate()}/${transactionDate.getFullYear()}`;
    const monthKey = transactionDate.toLocaleString("en-US", { month: "short" });

    if (dayTransactions[dayKey]) {
      dayTransactions[dayKey].amount += transaction.amount;
      if (!dayTransactions[dayKey].transactionsByChannel[transaction.channel]) {
        dayTransactions[dayKey].transactionsByChannel[transaction.channel] = 0;
      }
      dayTransactions[dayKey].transactionsByChannel[transaction.channel] += transaction.amount;
    }

    if (weekTransactions[weekKey]) {
      weekTransactions[weekKey].amount += transaction.amount;
      if (!weekTransactions[weekKey].transactionsByChannel[transaction.channel]) {
        weekTransactions[weekKey].transactionsByChannel[transaction.channel] = 0;
      }
      weekTransactions[weekKey].transactionsByChannel[transaction.channel] += transaction.amount;
    }

    if (monthTransactions[monthKey]) {
      monthTransactions[monthKey].amount += transaction.amount;
      if (!monthTransactions[monthKey].transactionsByChannel[transaction.channel]) {
        monthTransactions[monthKey].transactionsByChannel[transaction.channel] = 0;
      }
      monthTransactions[monthKey].transactionsByChannel[transaction.channel] += transaction.amount;
    }
  });

  let daySummary = Object.values(dayTransactions);
  let weekSummary = Object.values(weekTransactions);
  let monthSummary = Object.values(monthTransactions);

  // Calculate totals for percentages
  const totalDayAmount = daySummary.reduce((sum, d: any) => sum + d.amount, 0);
  const totalWeekAmount = weekSummary.reduce((sum, w: any) => sum + w.amount, 0);
  const totalMonthAmount = monthSummary.reduce((sum, m: any) => sum + m.amount, 0);

  // Assign percentages
  daySummary.forEach((d: any) => {
    d.percentage = totalDayAmount > 0 ? ((d.amount / totalDayAmount) * 100).toFixed(2) : "0.00";
  });
  weekSummary.forEach((w: any) => {
    w.percentage = totalWeekAmount > 0 ? ((w.amount / totalWeekAmount) * 100).toFixed(2) : "0.00";
  });
  monthSummary.forEach((m: any) => {
    m.percentage = totalMonthAmount > 0 ? ((m.amount / totalMonthAmount) * 100).toFixed(2) : "0.00";
  });

  // ✅ Reverse to make oldest → newest
  daySummary = daySummary.reverse();
  weekSummary = weekSummary.reverse();
  monthSummary = monthSummary.reverse();

  return {
    daySummary,
    weekSummary,
    monthSummary,
  };
};

export const getTransactionsByChannel = (transactions: any[]) => {
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());
  currentWeekStart.setHours(0, 0, 0, 0);

  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);

  const currentDay = today.toDateString();

  const transactionsByChannel: {
    currentDay: { [key: string]: { amount: number; count: number; percentage: string; max?: boolean } };
    currentWeek: { [key: string]: { amount: number; count: number; percentage: string; max?: boolean } };
    currentMonth: { [key: string]: { amount: number; count: number; percentage: string; max?: boolean } };
  } = {
    currentDay: {},
    currentWeek: {},
    currentMonth: {},
  };

  // Accumulate transactions
  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.createdAt);
    const transactionChannel = transaction.channel;

    // Day
    if (transactionDate.toDateString() === currentDay) {
      if (!transactionsByChannel.currentDay[transactionChannel]) {
        transactionsByChannel.currentDay[transactionChannel] = { amount: 0, count: 0, percentage: "0.00" };
      }
      transactionsByChannel.currentDay[transactionChannel].amount += transaction.amount;
      transactionsByChannel.currentDay[transactionChannel].count += 1;
    }

    // Week
    if (transactionDate >= currentWeekStart && transactionDate <= today) {
      if (!transactionsByChannel.currentWeek[transactionChannel]) {
        transactionsByChannel.currentWeek[transactionChannel] = { amount: 0, count: 0, percentage: "0.00" };
      }
      transactionsByChannel.currentWeek[transactionChannel].amount += transaction.amount;
      transactionsByChannel.currentWeek[transactionChannel].count += 1;
    }

    // Month
    if (transactionDate >= currentMonthStart && transactionDate <= today) {
      if (!transactionsByChannel.currentMonth[transactionChannel]) {
        transactionsByChannel.currentMonth[transactionChannel] = { amount: 0, count: 0, percentage: "0.00" };
      }
      transactionsByChannel.currentMonth[transactionChannel].amount += transaction.amount;
      transactionsByChannel.currentMonth[transactionChannel].count += 1;
    }
  });

  // Helper to calculate percentages & flag max
  const calculatePercentagesAndMax = (periodData: { [key: string]: { amount: number; count: number; percentage: string; max?: boolean } }) => {
    const totalAmount = Object.values(periodData).reduce((sum, item) => sum + item.amount, 0);

    let maxChannel: string | null = null;
    let maxPercentage = -1;

    Object.keys(periodData).forEach((channel) => {
      const item = periodData[channel];
      const pct = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;
      item.percentage = pct.toFixed(2);
      if (pct > maxPercentage) {
        maxPercentage = pct;
        maxChannel = channel;
      }
    });

    if (maxChannel) {
      periodData[maxChannel].max = true;
    }
  };

  calculatePercentagesAndMax(transactionsByChannel.currentDay);
  calculatePercentagesAndMax(transactionsByChannel.currentWeek);
  calculatePercentagesAndMax(transactionsByChannel.currentMonth);

  return transactionsByChannel;
};



export const listLowStockVariants = (inventory: any) => {
    const lowStockVariants: any = [];

    inventory.forEach((item: any) => {
        if(item?.type === 'sale') {
            item.variants.forEach((variant: any) => {
                if (variant.currentStock < variant.lowStockAlertCount) {
                    const lowStockInfo = {
                        id: item._id,
                        itemName: item.name,
                        variantName: variant.name,
                        currentStock: variant.currentStock,
                        saleUnit: variant.saleUnit,
                        image: item.coverImage
                    };
                    lowStockVariants.push(lowStockInfo);
                }
            });
        }
        if(item?.type === 'store') {
            if (item.currentStock < item.lowStockAlertCount) {
                const lowStockInfo = {
                    id: item._id,
                    itemName: item.name,
                    variantName: '',
                    currentStock: item.currentStock,
                    saleUnit: item.stockUnit,
                };
                lowStockVariants.push(lowStockInfo);
            }
        }
    });

    return lowStockVariants;
}
  
export const calculateMetrics = (orders: any[]) => {
  let todayOrdersCount = 0;
  let todayOrdersValue = 0;
  let yesterdayOrdersCount = 0;
  let yesterdayOrdersValue = 0;

  let thisWeekOrdersCount = 0;
  let thisWeekOrdersValue = 0;
  let lastWeekOrdersCount = 0;
  let lastWeekOrdersValue = 0;

  let thisMonthOrdersCount = 0;
  let thisMonthOrdersValue = 0;
  let lastMonthOrdersCount = 0;
  let lastMonthOrdersValue = 0;

  let soldItemsMap: {
    [key: string]: {
      name: string;
      quantity: number;
      salesValue: number;
      image: string | undefined;
    };
  } = {};

  let closedUnpaidOrdersCount = 0;
  let closedUnpaidOrdersValue = 0;
  let unpaidOrdersValue = 0;
  let unpaidOrdersCount = 0;
  let currentYearOrdersValue = 0;
  let mostSoldItem = { name: "", quantity: 0, salesValue: 0, image: "" };

  // Helpers
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(todayDate.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const { start: thisWeekStart, end: thisWeekEnd } = getWeekRange(todayDate);
  const { start: lastWeekStart, end: lastWeekEnd } = getWeekRange(
    new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - 7)
  );

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  for (const order of orders) {
    const { total, createdAt, status, paymentStatus, items } = order;
    const orderDate = new Date(createdAt);

    if (paymentStatus === "paid") {
      // Daily
      if (isSameDay(orderDate, todayDate)) {
        todayOrdersCount++;
        todayOrdersValue += total;
      } else if (isSameDay(orderDate, yesterdayDate)) {
        yesterdayOrdersCount++;
        yesterdayOrdersValue += total;
      }

      // Weekly
      if (orderDate >= thisWeekStart && orderDate <= thisWeekEnd) {
        thisWeekOrdersCount++;
        thisWeekOrdersValue += total;
      } else if (orderDate >= lastWeekStart && orderDate <= lastWeekEnd) {
        lastWeekOrdersCount++;
        lastWeekOrdersValue += total;
      }

      // Monthly
      if (orderDate >= thisMonthStart && orderDate <= todayDate) {
        thisMonthOrdersCount++;
        thisMonthOrdersValue += total;
      } else if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
        lastMonthOrdersCount++;
        lastMonthOrdersValue += total;
      }

      // Track sold items (only for current month to align with your logic)
      // if (orderDate >= thisMonthStart && orderDate <= todayDate) {
        for (const item of items) {
          const { displayName, quantity, price, parentItem } = item;
          const image = parentItem?.coverImage || undefined;

          if (soldItemsMap[displayName]) {
            soldItemsMap[displayName].quantity += quantity;
            soldItemsMap[displayName].salesValue += quantity * price;
          } else {
            soldItemsMap[displayName] = {
              name: displayName,
              quantity,
              salesValue: quantity * price,
              image,
            };
          }
        }
      // }
    }

    if ((status === "completed" || status === "cancelled" || status === "delivered") && paymentStatus === "unpaid") {
      closedUnpaidOrdersCount++;
      closedUnpaidOrdersValue += total;
    }

    if (paymentStatus === "unpaid") {
      unpaidOrdersValue += total;
      unpaidOrdersCount++;
    }

    if (orderDate.getFullYear() === new Date().getFullYear()) {
      currentYearOrdersValue += total;
    }
  }

  // Convert map to array & sort
  const soldItems = Object.values(soldItemsMap).sort((a, b) => b.quantity - a.quantity);

  if (soldItems.length > 0) {
    mostSoldItem = { ...soldItems[0], image: soldItems[0].image ?? "" };
  }

  // Helpers for % change
  const percentageChange = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return 0;
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  return {
    todayOrdersCount,
    todayOrdersValue,
    thisWeekOrdersCount,
    thisWeekOrdersValue,
    thisMonthOrdersCount,
    thisMonthOrdersValue,
    soldItems,
    mostSoldItem,
    closedUnpaidOrdersCount,
    closedUnpaidOrdersValue,
    unpaidOrdersValue,
    currentYearOrdersValue,
    unpaidOrdersCount,

    // New percentage fields
    percentageDailyChange: percentageChange(todayOrdersValue, yesterdayOrdersValue),
    percentageWeeklyChange: percentageChange(thisWeekOrdersValue, lastWeekOrdersValue),
    percentageMonthlyChange: percentageChange(thisMonthOrdersValue, lastMonthOrdersValue),
  };
};

export const analyzeCartMetrics = (carts: any[]) => {
  const abandonedCarts = carts.filter((cart: any) => cart.checkoutStatus === 'pending');
  const checkedOutCarts = carts.filter((cart: any) => cart.checkoutStatus === 'checked_out');

  const clientIdMap: { [clientId: string]: number } = {};
  checkedOutCarts.forEach((cart: any) => {
    if (cart.clientId) {
      clientIdMap[cart.clientId] = (clientIdMap[cart.clientId] || 0) + 1;
    }
  });

  const uniqueCustomers = Object.keys(clientIdMap).filter(clientId => clientIdMap[clientId] === 1).length;
  const repeatCustomers = Object.keys(clientIdMap).filter(clientId => clientIdMap[clientId] > 1).length;

  return {
    total: carts.length,
    abandoned: abandonedCarts.length,
    checkedOut: checkedOutCarts.length,
    abandonmentRate: carts.length > 0 
      ? ((abandonedCarts.length / carts.length) * 100).toFixed(2)
      : "0.00",
    customers: {
      unique: uniqueCustomers,
      repeat: repeatCustomers,
      total: Object.keys(clientIdMap).length
    },
    checkedOutClientIds: new Set(checkedOutCarts.map((cart: any) => cart.clientId))
  };
};

export const analyzeStoreFrontVisits = (visits: any[], checkedOutClientIds: Set<string>) => {
  const uniqueStoreVisits = visits.length;
  const totalVisits = visits.reduce((sum: number, visit: any) => sum + visit.visits, 0);
  const convertedVisitors = visits.filter((visit: any) => checkedOutClientIds.has(visit.clientId)).length;
  const conversionRate = uniqueStoreVisits > 0 
    ? ((convertedVisitors / uniqueStoreVisits) * 100).toFixed(2) 
    : "0.00";

  return {
    uniqueVisitors: uniqueStoreVisits,
    totalVisits: totalVisits,
    averageVisitsPerUser: uniqueStoreVisits > 0 
      ? (totalVisits / uniqueStoreVisits).toFixed(2)
      : "0.00",
    conversion: {
      rate: conversionRate,
      convertedVisitors: convertedVisitors,
      totalVisitors: uniqueStoreVisits
    }
  };
};

export const calculateECommerceOrderMetrics = (orders: any[]) => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());
  currentWeekStart.setHours(0, 0, 0, 0);
  
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);

  // Previous period starts
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  
  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setDate(currentWeekStart.getDate() - 7);
  
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

  const paymentMethodCounts: { [method: string]: number } = {};
  
  let todayOrdersCount = 0;
  let todayOrdersValue = 0;
  let todayProcessingTimes: number[] = [];
  
  let yesterdayOrdersCount = 0;
  let yesterdayOrdersValue = 0;
  
  let weekOrdersCount = 0;
  let weekOrdersValue = 0;
  let weekProcessingTimes: number[] = [];
  
  let lastWeekOrdersCount = 0;
  let lastWeekOrdersValue = 0;
  
  let monthOrdersCount = 0;
  let monthOrdersValue = 0;
  let monthProcessingTimes: number[] = [];
  
  let lastMonthOrdersCount = 0;
  let lastMonthOrdersValue = 0;
  
  orders.forEach((order: any) => {
    const orderDate = new Date(order.createdAt);
    
    // Payment methods
    if (order.paymentMethod) {
      paymentMethodCounts[order.paymentMethod] = (paymentMethodCounts[order.paymentMethod] || 0) + 1;
    }

    // Calculate processing time from statusHistory
    let processingTimeMinutes: number | null = null;
    if (order.statusHistory && order.statusHistory.length > 0) {
      const createdTime = new Date(order.createdAt).getTime();
      const completedStatus = order.statusHistory.find((history: any) => history.status === 'completed');
      
      if (completedStatus && completedStatus.timeStamp) {
        const completedTime = new Date(completedStatus.timeStamp).getTime();
        processingTimeMinutes = (completedTime - createdTime) / (1000 * 60);
      }
    }

    // Today's orders
    if (orderDate >= todayStart) {
      todayOrdersCount++;
      todayOrdersValue += order.total || 0;
      if (processingTimeMinutes !== null) {
        todayProcessingTimes.push(processingTimeMinutes);
      }
    }
    
    // Yesterday's orders
    if (orderDate >= yesterdayStart && orderDate < todayStart) {
      yesterdayOrdersCount++;
      yesterdayOrdersValue += order.total || 0;
    }

    // This week's orders
    if (orderDate >= currentWeekStart) {
      weekOrdersCount++;
      weekOrdersValue += order.total || 0;
      if (processingTimeMinutes !== null) {
        weekProcessingTimes.push(processingTimeMinutes);
      }
    }
    
    // Last week's orders
    if (orderDate >= lastWeekStart && orderDate < currentWeekStart) {
      lastWeekOrdersCount++;
      lastWeekOrdersValue += order.total || 0;
    }

    // This month's orders
    if (orderDate >= currentMonthStart) {
      monthOrdersCount++;
      monthOrdersValue += order.total || 0;
      if (processingTimeMinutes !== null) {
        monthProcessingTimes.push(processingTimeMinutes);
      }
    }
    
    // Last month's orders
    if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
      lastMonthOrdersCount++;
      lastMonthOrdersValue += order.total || 0;
    }
  });

  const calculateAverage = (times: number[]) => 
    times.length > 0 ? (times.reduce((sum, time) => sum + time, 0) / times.length).toFixed(2) : "0.00";

  const percentageChange = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return 0;
    if (previous === 0) return 100;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  };

  const paymentMethods = Object.keys(paymentMethodCounts).map(method => ({
    method,
    count: paymentMethodCounts[method],
    percentage: orders.length > 0 
      ? ((paymentMethodCounts[method] / orders.length) * 100).toFixed(2)
      : "0.00"
  }));

  return {
    orders: {
      today: {
        count: todayOrdersCount,
        value: todayOrdersValue,
        averageProcessingTime: calculateAverage(todayProcessingTimes),
        percentageChange: percentageChange(todayOrdersValue, yesterdayOrdersValue)
      },
      week: {
        count: weekOrdersCount,
        value: weekOrdersValue,
        averageProcessingTime: calculateAverage(weekProcessingTimes),
        percentageChange: percentageChange(weekOrdersValue, lastWeekOrdersValue)
      },
      month: {
        count: monthOrdersCount,
        value: monthOrdersValue,
        averageProcessingTime: calculateAverage(monthProcessingTimes),
        percentageChange: percentageChange(monthOrdersValue, lastMonthOrdersValue)
      }
    },
    paymentMethods
  };
};

export const calculateReviewMetrics = (reviews: any[]) => {
  if (!reviews || reviews.length === 0) {
    return {
      averageStoreRating: 0,
      totalReviews: 0,
      sentiments: {
        positive: { count: 0, percentage: "0.00" },
        negative: { count: 0, percentage: "0.00" },
        neutral: { count: 0, percentage: "0.00" }
      },
      highestRatedItem: null,
      lowestRatedItem: null
    };
  }

  // Calculate average store rating
  const totalRating = reviews.reduce((sum: number, review: any) => {
    const rating = typeof review.rating === 'number' ? review.rating : Number(review.rating) || 0;
    return sum + rating;
  }, 0);
  const averageStoreRating = totalRating / reviews.length;

  // Calculate rating sentiments
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  reviews.forEach((review: any) => {
    const rating = typeof review.rating === 'number' ? review.rating : Number(review.rating) || 0;
    if (rating >= 4) {
      positiveCount++;
    } else if (rating <= 2) {
      negativeCount++;
    } else {
      neutralCount++;
    }
  });

  const totalReviews = reviews.length;
  const sentiments = {
    positive: {
      count: positiveCount,
      percentage: ((positiveCount / totalReviews) * 100).toFixed(2)
    },
    negative: {
      count: negativeCount,
      percentage: ((negativeCount / totalReviews) * 100).toFixed(2)
    },
    neutral: {
      count: neutralCount,
      percentage: ((neutralCount / totalReviews) * 100).toFixed(2)
    }
  };

  // Group reviews by item to find highest and lowest rated items
  const itemRatings: {
    [itemId: string]: {
      itemId: string;
      itemName: string;
      itemImage: string | undefined;
      ratings: number[];
      averageRating: number;
      reviewCount: number;
    }
  } = {};

  reviews.forEach((review: any) => {
    if (review.item) {
      const itemId = review.item._id?.toString() || review.item.toString();
      const itemName = review.item.name || 'Unknown Item';
      const itemImage = review.item.coverImage || undefined;
      const rating = typeof review.rating === 'number' ? review.rating : Number(review.rating) || 0;

      if (!itemRatings[itemId]) {
        itemRatings[itemId] = {
          itemId,
          itemName,
          itemImage,
          ratings: [],
          averageRating: 0,
          reviewCount: 0
        };
      }

      itemRatings[itemId].ratings.push(rating);
    }
  });

  // Calculate average ratings for each item
  Object.keys(itemRatings).forEach(itemId => {
    const item = itemRatings[itemId];
    const sum = item.ratings.reduce((acc, rating) => acc + rating, 0);
    item.averageRating = sum / item.ratings.length;
    item.reviewCount = item.ratings.length;
  });

  const itemsArray = Object.values(itemRatings);

  // Find highest rated item
  let highestRatedItem = null;
  if (itemsArray.length > 0) {
    highestRatedItem = itemsArray.reduce((highest, current) => 
      current.averageRating > highest.averageRating ? current : highest
    );
  }

  // Find lowest rated item
  let lowestRatedItem = null;
  if (itemsArray.length > 0) {
    lowestRatedItem = itemsArray.reduce((lowest, current) => 
      current.averageRating < lowest.averageRating ? current : lowest
    );
  }

  // If highest and lowest are the same item, set lowest to null
  if (highestRatedItem && lowestRatedItem && highestRatedItem.itemId === lowestRatedItem.itemId) {
    lowestRatedItem = null;
  }

  return {
    averageStoreRating: Number(averageStoreRating.toFixed(2)),
    totalReviews,
    sentiments,
    highestRatedItem: highestRatedItem ? {
      itemId: highestRatedItem.itemId,
      itemName: highestRatedItem.itemName,
      itemImage: highestRatedItem.itemImage,
      averageRating: Number(highestRatedItem.averageRating.toFixed(2)),
      reviewCount: highestRatedItem.reviewCount
    } : null,
    lowestRatedItem: lowestRatedItem ? {
      itemId: lowestRatedItem.itemId,
      itemName: lowestRatedItem.itemName,
      itemImage: lowestRatedItem.itemImage,
      averageRating: Number(lowestRatedItem.averageRating.toFixed(2)),
      reviewCount: lowestRatedItem.reviewCount
    } : null
  };
};



  
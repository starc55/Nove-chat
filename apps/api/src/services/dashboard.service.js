import { prisma } from "../config/database.js";

export async function getDashboard() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const activeAdvertisementWhere = {
    enabled: true,
    AND: [
      { OR: [{ startAt: null }, { startAt: { lte: now } }] },
      { OR: [{ endAt: null }, { endAt: { gte: now } }] }
    ]
  };

  const [
    conversationsToday, openChats, waitingChats, offlineLeads, onlineOperators,
    totalProducts, activeAdvertisements, ratingAggregate, newReviews, newOrders, archivedChats,
    recentConversations, recentLeads, recentReviews, operators
  ] = await Promise.all([
    prisma.conversation.count({ where: { startedAt: { gte: today } } }),
    prisma.conversation.count({ where: { status: { in: ["OPEN", "ASSIGNED"] } } }),
    prisma.conversation.count({ where: { status: "WAITING" } }),
    prisma.lead.count({ where: { status: "NEW", source: "offline_chat" } }),
    prisma.operator.count({ where: { status: "ONLINE", user: { active: true } } }),
    prisma.product.count({ where: { active: true } }),
    prisma.advertisement.count({ where: activeAdvertisementWhere }),
    prisma.rating.aggregate({ _avg: { rating: true } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.purchaseRequest.count({ where: { status: "NEW" } }),
    prisma.conversation.count({ where: { status: "CLOSED" } }),
    prisma.conversation.findMany({
      take: 6,
      orderBy: { lastMessageAt: "desc" },
      include: { customer: { select: { name: true, visitorId: true } }, assignedOperator: { select: { displayName: true } }, messages: { take: 1, orderBy: { createdAt: "desc" }, select: { content: true } } }
    }),
    prisma.lead.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, phone: true, status: true, createdAt: true } }),
    prisma.review.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, customerName: true, rating: true, comment: true, status: true, createdAt: true } }),
    prisma.operator.findMany({
      where: { user: { active: true } },
      include: { _count: { select: { conversations: true } }, ratings: { select: { rating: true } } },
      orderBy: { displayName: "asc" }
    })
  ]);

  return {
    kpis: {
      conversationsToday,
      openChats,
      waitingChats,
      offlineLeads,
      onlineOperators,
      totalProducts,
      activeAdvertisements,
      averageRating: Number((ratingAggregate._avg.rating || 0).toFixed(1)),
      newReviews,
      newOrders,
      archivedChats
    },
    recentConversations: recentConversations.map((item) => ({
      id: item.id,
      publicId: item.publicId,
      customer: item.customer.name || `#${item.customer.visitorId.slice(-6).toUpperCase()}`,
      status: item.status,
      operator: item.assignedOperator?.displayName || "Biriktirilmagan",
      lastMessage: item.messages[0]?.content || "Xabar yo‘q",
      lastMessageAt: item.lastMessageAt
    })),
    recentLeads,
    recentReviews,
    operatorPerformance: operators.map((operator) => ({
      id: operator.id,
      name: operator.displayName,
      status: operator.status,
      conversations: operator._count.conversations,
      rating: operator.ratings.length ? Number((operator.ratings.reduce((sum, item) => sum + item.rating, 0) / operator.ratings.length).toFixed(1)) : 0
    }))
  };
}

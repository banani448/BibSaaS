import prisma from '../config/prisma';
import AppError from '../utils/errors/app-error';
import { InvoiceStatus } from '@prisma/client';

class InvoiceService {
  /**
   * Create invoice from payment
   */
  async createInvoice(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            profile: true,
            email: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    if (payment.status !== 'SUCCESS') {
      throw new AppError('Payment must be successful to generate invoice', 400, 'PAYMENT_NOT_COMPLETED');
    }

    // Check if invoice already exists for this payment
    const existingInvoice = await prisma.invoice.findFirst({
      where: { payments: { some: { id: paymentId } } },
    });

    if (existingInvoice) {
      return existingInvoice;
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const billingName = payment.user?.profile
      ? `${payment.user.profile.firstName || ''} ${payment.user.profile.lastName || ''}`.trim()
      : undefined;

    const invoice = await prisma.invoice.create({
      data: {
        userId: payment.userId,
        invoiceNumber,
        subtotal: payment.amount,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: payment.amount,
        currency: payment.currency,
        status: InvoiceStatus.ISSUED,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        paidAt: new Date(),
        billingName,
        billingEmail: payment.user?.email || undefined,
        items: {
          create: [
            {
              description: payment.subscription?.plan?.name || 'Service payment',
              quantity: 1,
              unitPrice: payment.amount,
              totalPrice: payment.amount,
            },
          ],
        },
      },
    });

    // Link payment to invoice
    await prisma.payment.update({
      where: { id: paymentId },
      data: { invoiceId: invoice.id },
    });

    return invoice;
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: {
          select: {
            id: true,
            profile: true,
            email: true,
          },
        },
        payments: {
          select: {
            amount: true,
            currency: true,
            paymentMethod: true,
            status: true,
          },
        },
        items: true,
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    return invoice;
  }

  /**
   * Get user's invoices
   */
  async getUserInvoices(userId: string, params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          payments: {
            select: {
              amount: true,
              currency: true,
              paymentMethod: true,
              status: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List all invoices (admin)
   */
  async listInvoices(params: {
    page?: number;
    limit?: number;
    userId?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const { page = 1, limit = 20, userId, status, fromDate, toDate } = params;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.issueDate = {};
      if (fromDate) {
        where.issueDate.gte = fromDate;
      }
      if (toDate) {
        where.issueDate.lte = toDate;
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              profile: true,
              email: true,
            },
          },
          payments: {
            select: {
              amount: true,
              currency: true,
              paymentMethod: true,
              status: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: status as InvoiceStatus,
        ...(status === 'PAID' && { paidAt: new Date() }),
      },
    });

    return updatedInvoice;
  }

  /**
   * Delete invoice (admin only)
   */
  async deleteInvoice(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return { message: 'Invoice deleted successfully' };
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(params: { startDate?: Date; endDate?: Date }) {
    const { startDate, endDate } = params;

    const where: any = {};

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = startDate;
      }
      if (endDate) {
        where.issueDate.lte = endDate;
      }
    }

    const [totalInvoices, paidInvoices, pendingInvoices, totalRevenue] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.count({ where: { ...where, status: 'PAID' } }),
      prisma.invoice.count({ where: { ...where, status: 'PENDING' } }),
      prisma.invoice.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
  }
}

export default new InvoiceService();

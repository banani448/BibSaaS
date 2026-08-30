import { Router } from 'express';
import invoiceController from '../controllers/invoice.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/invoices
 * @desc    Create invoice from payment
 * @access  Private (Admin only)
 */
router.post('/', authenticate, authorize('SUPER_ADMIN'), invoiceController.createInvoice.bind(invoiceController));

/**
 * @route   GET /api/invoices/me
 * @desc    Get current user's invoices
 * @access  Private
 */
router.get('/me', authenticate, invoiceController.getMyInvoices.bind(invoiceController));

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get('/:id', authenticate, invoiceController.getInvoiceById.bind(invoiceController));

/**
 * @route   GET /api/invoices
 * @desc    List all invoices
 * @access  Private (Admin only)
 */
router.get('/', authenticate, authorize('SUPER_ADMIN'), invoiceController.listInvoices.bind(invoiceController));

/**
 * @route   PATCH /api/invoices/:id/status
 * @desc    Update invoice status
 * @access  Private (Admin only)
 */
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN'), invoiceController.updateInvoiceStatus.bind(invoiceController));

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete invoice
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), invoiceController.deleteInvoice.bind(invoiceController));

/**
 * @route   GET /api/invoices/stats
 * @desc    Get invoice statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authenticate, authorize('SUPER_ADMIN'), invoiceController.getInvoiceStats.bind(invoiceController));

export default router;

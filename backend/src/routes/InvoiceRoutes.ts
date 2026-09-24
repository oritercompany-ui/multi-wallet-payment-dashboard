import {
  Router,
} from "express";

import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
} from "../controllers/InvoiceController";

const router = Router();

router.post(
  "/",
  createInvoice
);

router.get(
  "/",
  getInvoices
);

router.get(
  "/:id",
  getInvoiceById
);

router.patch(
  "/:id",
  updateInvoice
);

export default router;